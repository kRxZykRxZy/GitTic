import { Router, type Request, type Response, type NextFunction } from "express";
import { handleGitHttpRequest, listBranches, listTags, getDiff } from "@platform/git";
import { optionalAuth, requireAuth } from "../middleware/auth-guard.js";
import { comparePassword } from "@platform/auth";
import { getConfig } from "../config/app-config.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as analyticsRepo from "../db/repositories/analytics-repo.js";

/**
 * Git HTTP smart protocol routes and REST API endpoints
 * for repository branch, tag, and diff operations.
 */
const router = Router();

/**
 * Resolve a project from owner username and repo slug.
 * Returns the project or null if not found.
 */
function resolveProject(owner: string, repo: string): ReturnType<typeof projectRepo.findById> {
    const user = userRepo.findByUsername(owner);
    if (!user) return null;

    // Strip .git suffix if present
    const slug = repo.replace(/\.git$/, "");
    return projectRepo.findBySlug(user.id, slug);
}

/**
 * Check if the requesting user can access a project for git operations.
 * Public repos are always accessible; private repos require the owner or admin.
 */
function canAccess(
    project: NonNullable<ReturnType<typeof projectRepo.findById>>,
    userId?: string,
    role?: string,
): boolean {
    if (!project.isPrivate) return true;
    if (!userId) return false;
    if (project.ownerId === userId) return true;
    if (role === "admin") return true;
    return false;
}

/**
 * Extract the relative repo path from a full storage path.
 * Falls back to the full storagePath if the basePath prefix is not found.
 */
function getRepoRelPath(storagePath: string, basePath: string): string {
    const prefix = basePath.endsWith("/") ? basePath : basePath + "/";
    if (storagePath.startsWith(prefix)) {
        return storagePath.slice(prefix.length);
    }
    return storagePath;
}

function sendGitAuthChallenge(res: Response): void {
    res.setHeader("WWW-Authenticate", 'Basic realm="Git Access"');
    res.status(401).end("Authentication required");
}

function parseBasicCredentials(req: Request): { username: string; password: string } | null {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Basic ")) return null;

    const encoded = header.slice("Basic ".length).trim();
    let decoded = "";
    try {
        decoded = Buffer.from(encoded, "base64").toString("utf8");
    } catch {
        return null;
    }

    const separator = decoded.indexOf(":");
    if (separator <= 0) return null;

    const username = decoded.slice(0, separator);
    const password = decoded.slice(separator + 1);
    if (!username || !password) return null;

    return { username, password };
}

async function gitHttpAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
    optionalAuth(req, res, () => undefined);
    if (req.user) {
        next();
        return;
    }

    const creds = parseBasicCredentials(req);
    if (!creds) {
        next();
        return;
    }

    const user = userRepo.findByUsername(creds.username) ?? userRepo.findByEmail(creds.username);
    if (!user) {
        sendGitAuthChallenge(res);
        return;
    }

    const ok = await comparePassword(creds.password, user.passwordHash);
    if (!ok) {
        sendGitAuthChallenge(res);
        return;
    }

    req.user = {
        id: user.id,
        userId: user.id,
        username: user.username,
        role: user.role,
        tier: "free",
    };

    next();
}

/* ── Git Smart HTTP Protocol ──────────────────────────────── */

/**
 * GET /:owner/:repo.git/info/refs
 *
 * Git info/refs endpoint for smart HTTP protocol.
 * Used by `git clone`, `git fetch`, and `git push` for
 * capability advertisement.
 */
router.get(
    "/:owner/:repo.git/info/refs",
    gitHttpAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccess(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Track clone count for upload-pack (clone/fetch)
            const serviceParam = String(req.query.service || "");
            if (serviceParam !== "git-upload-pack" && serviceParam !== "git-receive-pack") {
                res.status(400).json({ error: "Invalid or missing service parameter", code: "VALIDATION_ERROR" });
                return;
            }
            if (serviceParam === "git-upload-pack") {
                projectRepo.incrementCloneCount(project.id);
            }

            const config = getConfig();
            const basePath = config.dataDir + "/repos";
            const repoRelPath = getRepoRelPath(project.storagePath, basePath);
            handleGitHttpRequest(basePath, req, res, repoRelPath, serviceParam);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /:owner/:repo.git/info/refs
 *
 * POST variant for info/refs (some git clients use this).
 */
router.post(
    "/:owner/:repo.git/info/refs",
    gitHttpAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project || !canAccess(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            const config = getConfig();
            const basePath = config.dataDir + "/repos";
            const repoRelPath = getRepoRelPath(project.storagePath, basePath);
            const serviceParam = String(req.query.service || "git-upload-pack");
            if (serviceParam !== "git-upload-pack" && serviceParam !== "git-receive-pack") {
                res.status(400).json({ error: "Invalid service parameter", code: "VALIDATION_ERROR" });
                return;
            }
            handleGitHttpRequest(basePath, req, res, repoRelPath, serviceParam);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /:owner/:repo.git/git-upload-pack
 *
 * Handles the git upload-pack protocol (clone / fetch).
 */
router.post(
    "/:owner/:repo.git/git-upload-pack",
    gitHttpAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project || !canAccess(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            const config = getConfig();
            const basePath = config.dataDir + "/repos";
            const repoRelPath = getRepoRelPath(project.storagePath, basePath);
            handleGitHttpRequest(basePath, req, res, repoRelPath, "git-upload-pack");
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /:owner/:repo.git/git-receive-pack
 *
 * Handles the git receive-pack protocol (push).
 * Requires authentication – only the owner or admin can push.
 */
router.post(
    "/:owner/:repo.git/git-receive-pack",
    gitHttpAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!req.user) {
                sendGitAuthChallenge(res);
                return;
            }

            // Only owner or admin can push
            if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Push access denied", code: "FORBIDDEN" });
                return;
            }

            const config = getConfig();
            const basePath = config.dataDir + "/repos";
            const repoRelPath = getRepoRelPath(project.storagePath, basePath);
            analyticsRepo.logAnalyticsEvent({
                eventType: "repo.push",
                actorUserId: req.user!.userId,
                repositoryId: project.id,
                metadata: { owner: String(req.params.owner), repo: String(req.params.repo) },
            });
            handleGitHttpRequest(basePath, req, res, repoRelPath, "git-receive-pack");
        } catch (err) {
            next(err);
        }
    },
);

/* ── REST API for repository metadata ─────────────────────── */

/**
 * GET /api/repos/:owner/:repo/branches
 *
 * Lists all branches in a repository.
 */
router.get(
    "/api/repos/:owner/:repo/branches",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project || !canAccess(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            const branches = await listBranches(project.storagePath);
            res.json({ data: branches });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repos/:owner/:repo/tags
 *
 * Lists all tags in a repository.
 */
router.get(
    "/api/repos/:owner/:repo/tags",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project || !canAccess(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            const tags = await listTags(project.storagePath);
            res.json({ data: tags });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repos/:owner/:repo/diff
 *
 * Returns the diff between two refs (branches, tags, or commits).
 *
 * @query base - Base ref (required).
 * @query head - Head ref (required).
 */
router.get(
    "/api/repos/:owner/:repo/diff",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = resolveProject(String(req.params.owner), String(req.params.repo));
            if (!project || !canAccess(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            const base = req.query.base ? String(req.query.base) : undefined;
            const head = req.query.head ? String(req.query.head) : undefined;

            if (!base || !head) {
                res.status(400).json({
                    error: "Both 'base' and 'head' query parameters are required",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            const diff = await getDiff(project.storagePath, base, head);
            res.json({ diff });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
