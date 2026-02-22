import { Router, type Request, type Response, type NextFunction } from "express";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import * as nodePath from "node:path";
import { requireAuth } from "../middleware/auth-guard.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as clusterRepo from "../db/repositories/cluster-repo.js";
import { getConfig } from "../config/app-config.js";

const router = Router();

type TerminalSession = {
    id: string;
    userId: string;
    owner: string;
    repo: string;
    branch: string;
    shell: ChildProcessWithoutNullStreams;
    output: string[];
    createdAt: string;
    clusterId: string | null;
    workspaceDir: string;
};

const sessions = new Map<string, TerminalSession>();

function resolveRepository(owner: string, repo: string) {
    const user = userRepo.findByUsername(owner);
    if (!user) return null;
    return projectRepo.findBySlug(user.id, repo);
}

function canAccessRepository(project: NonNullable<ReturnType<typeof projectRepo.findById>>, userId?: string, role?: string): boolean {
    if (!project.isPrivate) return true;
    if (!userId) return false;
    if (project.ownerId === userId) return true;
    if (role === "admin") return true;
    return false;
}

function getRepositoryFsRoot(project: NonNullable<ReturnType<typeof projectRepo.findById>>): string {
    if (nodePath.isAbsolute(project.storagePath)) {
        return project.storagePath;
    }
    return nodePath.resolve(getConfig().dataDir, project.storagePath);
}

function appendOutput(session: TerminalSession, chunk: string): void {
    session.output.push(chunk);
    if (session.output.length > 1200) {
        session.output.splice(0, session.output.length - 1200);
    }
}

function selectClusterId(): string | null {
    const nodes = clusterRepo.listNodes("online");
    if (nodes.length === 0) return null;
    return nodes[0].id;
}

router.post(
    "/:owner/:repo/terminal/session",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const branch = typeof req.body?.branch === "string" ? req.body.branch : "main";

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            const repoRoot = getRepositoryFsRoot(project);
            const sessionsRoot = nodePath.resolve(getConfig().dataDir, "terminal-sessions");
            const sessionId = randomUUID();
            const workspaceDir = nodePath.join(sessionsRoot, sessionId);
            await fs.mkdir(workspaceDir, { recursive: true });

            const isWin = process.platform === "win32";
            const shellCmd = isWin ? "powershell.exe" : "bash";
            const shell = spawn(shellCmd, [], {
                cwd: workspaceDir,
                env: process.env,
                stdio: "pipe",
            });

            const session: TerminalSession = {
                id: sessionId,
                userId: req.user!.userId,
                owner,
                repo,
                branch,
                shell,
                output: [],
                createdAt: new Date().toISOString(),
                clusterId: selectClusterId(),
                workspaceDir,
            };

            shell.stdout.on("data", (data: Buffer) => appendOutput(session, data.toString("utf-8")));
            shell.stderr.on("data", (data: Buffer) => appendOutput(session, data.toString("utf-8")));
            shell.on("exit", (code) => appendOutput(session, `\n[session exited with code ${String(code)}]\n`));

            sessions.set(sessionId, session);

            const initCommand = isWin
                ? `git clone "${repoRoot}" repo; Set-Location repo; git checkout ${branch}; Write-Output "Terminal ready in $(Get-Location)"`
                : `git clone "${repoRoot}" repo && cd repo && git checkout ${branch} && echo "Terminal ready in $(pwd)"`;

            shell.stdin.write(`${initCommand}\n`);

            res.status(201).json({
                success: true,
                data: {
                    sessionId,
                    clusterId: session.clusterId,
                    branch,
                    status: "ready",
                },
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
);

router.get(
    "/:owner/:repo/terminal/session/:sessionId/output",
    requireAuth,
    (req: Request, res: Response) => {
        const owner = String(req.params.owner).toLowerCase();
        const repo = String(req.params.repo).toLowerCase();
        const sessionId = String(req.params.sessionId);
        const cursor = Math.max(0, Number(req.query.cursor ?? 0));

        const session = sessions.get(sessionId);
        if (!session || session.owner !== owner || session.repo !== repo) {
            res.status(404).json({ error: "Session not found", code: "NOT_FOUND" });
            return;
        }

        if (session.userId !== req.user!.userId && req.user!.role !== "admin") {
            res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
            return;
        }

        const output = session.output.slice(cursor);
        res.json({
            success: true,
            data: {
                output,
                cursor: session.output.length,
            },
            timestamp: new Date().toISOString(),
        });
    },
);

router.post(
    "/:owner/:repo/terminal/session/:sessionId/command",
    requireAuth,
    (req: Request, res: Response) => {
        const owner = String(req.params.owner).toLowerCase();
        const repo = String(req.params.repo).toLowerCase();
        const sessionId = String(req.params.sessionId);
        const command = typeof req.body?.command === "string" ? req.body.command.trim() : "";

        if (!command) {
            res.status(400).json({ error: "command is required", code: "VALIDATION_ERROR" });
            return;
        }

        const session = sessions.get(sessionId);
        if (!session || session.owner !== owner || session.repo !== repo) {
            res.status(404).json({ error: "Session not found", code: "NOT_FOUND" });
            return;
        }

        if (session.userId !== req.user!.userId && req.user!.role !== "admin") {
            res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
            return;
        }

        appendOutput(session, `\n$ ${command}\n`);
        session.shell.stdin.write(`${command}\n`);

        res.json({
            success: true,
            data: { accepted: true },
            timestamp: new Date().toISOString(),
        });
    },
);

router.delete(
    "/:owner/:repo/terminal/session/:sessionId",
    requireAuth,
    (req: Request, res: Response) => {
        const owner = String(req.params.owner).toLowerCase();
        const repo = String(req.params.repo).toLowerCase();
        const sessionId = String(req.params.sessionId);

        const session = sessions.get(sessionId);
        if (!session || session.owner !== owner || session.repo !== repo) {
            res.status(404).json({ error: "Session not found", code: "NOT_FOUND" });
            return;
        }

        if (session.userId !== req.user!.userId && req.user!.role !== "admin") {
            res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
            return;
        }

        session.shell.kill();
        sessions.delete(sessionId);

        res.json({
            success: true,
            data: { closed: true },
            timestamp: new Date().toISOString(),
        });
    },
);

export default router;
