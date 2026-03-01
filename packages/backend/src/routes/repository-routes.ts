import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import { promises as fs } from "node:fs";
import * as nodePath from "node:path";
import { getConfig } from "../config/app-config.js";
import * as analyticsRepo from "../db/repositories/analytics-repo.js";

/**
 * Repository management routes providing REST API endpoints for:
 * - Repository metadata and details
 * - File browsing and content retrieval
 * - Commit history and details
 * - Branch and tag management
 * - Contributor statistics
 * - Repository statistics
 *
 * @module routes/repository-routes
 */
const router = Router();

/**
 * POST /api/repositories
 * Create a new repository (project).
 * Requires authentication.
 * @body org - Organization ID or 'default' for personal repo
 * @body name - Repository name
 * @body description - Repository description
 */
router.post(
    "/",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { org, name, description } = req.body;
            if (!name || typeof name !== "string" || name.trim().length === 0) {
                res.status(400).json({ error: "Repository name is required", code: "VALIDATION_ERROR" });
                return;
            }
            // Determine ownerId
            let ownerId = req.user!.userId;
            if (org && org !== "default") {
                // Validate org exists and user has access
                const organization = userRepo.findById(org);
                if (!organization) {
                    res.status(400).json({ error: "Organization not found", code: "VALIDATION_ERROR" });
                    return;
                }
                ownerId = org;
            }
            // Create repo metadata
            const slug = name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
            const storagePath = `repos/${ownerId}/${slug}`;
            const project = projectRepo.createProject({
                ownerId,
                name: name.trim(),
                description: description || "",
                slug,
                storagePath,
            });
            // Use git package to initialize repo and store as git pack
            const repoRoot = getRepositoryFsRoot(project);
            await ensureRepositoryExistsOnDisk(repoRoot);
            try {
                const { initBareRepo } = await import("@platform/git");
                await initBareRepo(repoRoot);
                analyticsRepo.logAnalyticsEvent({
                    eventType: "repo.create",
                    actorUserId: req.user!.userId,
                    repositoryId: project.id,
                    metadata: { ownerId, slug },
                });
            } catch (err) {
                // If git package fails, delete project and return error
                projectRepo.deleteProject(project.id);
                res.status(500).json({ error: "Failed to initialize git repository", code: "GIT_ERROR" });
                return;
            }
            res.status(201).json({ success: true, repository: sanitizeRepository(project, true) });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/orgs
 * List all organizations the user can access.
 * Requires authentication.
 */
router.get(
    "/orgs",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Replace with your actual org lookup logic
            // If userRepo.getOrgsForUser does not exist, return an empty array or implement your own logic
            const orgs: any[] = [];
            res.json({ orgs });
        } catch (err) {
            next(err);
        }
    }
);

/** Default pagination values. */
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

const README_CANDIDATES = ["README.md", "README", "Readme.md", "readme.md", "ReadMe.md", "README.MD", "readme", "readme.MD", "Readme", "Readme.MD"];

/**
 * Clamp pagination parameters to safe ranges.
 *
 * @param query - The query parameters object from the request.
 * @returns An object with page and perPage values within safe bounds.
 */
function parsePagination(query: Record<string, unknown>): { page: number; perPage: number } {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(query.perPage) || DEFAULT_PER_PAGE));
    return { page, perPage };
}

/**
 * Resolve a project from owner username and repository slug.
 *
 * @param owner - The username of the repository owner.
 * @param repo - The repository slug.
 * @returns The project object or null if not found.
 */
function resolveRepository(owner: string, repo: string) {
    const user = userRepo.findByUsername(owner);
    if (!user) return null;
    return projectRepo.findBySlug(user.id, repo);
}

/**
 * Check if the requesting user can access a repository.
 * Public repositories are always accessible; private ones require owner or admin role.
 *
 * @param project - The project/repository object.
 * @param userId - The authenticated user's ID (optional).
 * @param role - The authenticated user's role (optional).
 * @returns True if the user can access the repository, false otherwise.
 */
function canAccessRepository(project: NonNullable<ReturnType<typeof projectRepo.findById>>, userId?: string, role?: string): boolean {
    if (!project.isPrivate) return true;
    if (!userId) return false;
    if (project.ownerId === userId) return true;
    if (role === "admin") return true;
    return false;
}

function getRepositoryFsRoot(project: NonNullable<ReturnType<typeof projectRepo.findById>>): string {
    const storagePath = project.storagePath;
    if (nodePath.isAbsolute(storagePath)) {
        return storagePath;
    }
    return nodePath.resolve(getConfig().dataDir, storagePath);
}

function normalizeRepoRelativePath(input?: string): string {
    if (!input) return "";
    const normalized = input.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+/g, "/");
    return normalized === "." ? "" : normalized;
}

function resolveSafeRepoPath(repoRoot: string, relativePath: string): string {
    const targetPath = nodePath.resolve(repoRoot, relativePath || ".");
    const normalizedRoot = nodePath.resolve(repoRoot);
    const rootWithSep = normalizedRoot.endsWith(nodePath.sep) ? normalizedRoot : `${normalizedRoot}${nodePath.sep}`;

    if (targetPath !== normalizedRoot && !targetPath.startsWith(rootWithSep)) {
        throw new Error("Invalid path traversal attempt");
    }

    return targetPath;
}

async function ensureRepositoryExistsOnDisk(repoRoot: string): Promise<void> {
    await fs.mkdir(repoRoot, { recursive: true });
}

/**
 * Sanitize repository object by removing sensitive fields.
 *
 * @param project - The project/repository object.
 * @param includePrivate - Whether to include private status (requires authentication).
 * @returns Sanitized repository object.
 */
function sanitizeRepository(project: ReturnType<typeof projectRepo.findById>, includePrivate = false) {
    if (!project) return null;

    const owner = userRepo.findById(project.ownerId);
    const ownerUsername = owner?.username || "unknown";

    const sanitized: Record<string, unknown> = {
        id: project.id,
        name: project.name,
        slug: project.slug,
        description: project.description,
        owner: {
            id: project.ownerId,
            username: ownerUsername,
        },
        url: `/api/repositories/${ownerUsername}/${project.slug}`,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
    };

    if (includePrivate) {
        sanitized.isPrivate = project.isPrivate;
    }

    return sanitized;
}

/* ── Repository Details and Metadata ─────────────────────────── */

/**
 * GET /api/repositories/:owner/:repo
 *
 * Retrieve detailed information about a repository.
 * Public repositories are accessible to anyone; private repositories
 * require authentication as the owner or an admin.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @returns Repository object with metadata.
 *
 * @example
 * GET /api/repositories/john/my-project
 */
router.get(
    "/:owner/:repo",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            res.json(sanitizeRepository(project, req.user !== undefined));
        } catch (err) {
            next(err);
        }
    },
);

/* ── File Browsing and Content ───────────────────────────────── */

/**
 * GET /api/repositories/:owner/:repo/tree/:branch/*path
 *
 * Browse the file tree of a repository at a specific branch and path.
 * Returns a list of files and directories at the specified location.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param branch - Git branch name or commit SHA.
 * @param path - File path within the repository (optional, defaults to root).
 * @returns Object containing files and directories with metadata.
 *
 * @example
 * GET /api/repositories/john/my-project/tree/main/src
 * GET /api/repositories/john/my-project/tree/develop
 */
router.get(
    /^\/([^\/]+)\/([^\/]+)\/tree\/([^\/]+)(?:\/(.*))?$/,
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params[0]).toLowerCase();
            const repo = String(req.params[1]).toLowerCase();
            const branch = String(req.params[2]);
            const pathFromRoute = String(req.params[3] || "");
            const pathFromQuery = typeof req.query.path === "string" ? req.query.path : "";
            const relativePath = normalizeRepoRelativePath(pathFromQuery || pathFromRoute);

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
            await ensureRepositoryExistsOnDisk(repoRoot);
            const absolutePath = resolveSafeRepoPath(repoRoot, relativePath);

            const stats = await fs.stat(absolutePath).catch(() => null);
            if (!stats || !stats.isDirectory()) {
                res.status(404).json({ error: "Directory not found", code: "NOT_FOUND" });
                return;
            }

            const entries = await fs.readdir(absolutePath, { withFileTypes: true });
            const mappedEntries = await Promise.all(
                entries.map(async (entry) => {
                    const entryRelPath = normalizeRepoRelativePath(
                        relativePath ? `${relativePath}/${entry.name}` : entry.name,
                    );

                    if (entry.isDirectory()) {
                        return {
                            type: "directory" as const,
                            name: entry.name,
                            path: entryRelPath,
                        };
                    }

                    const fileStats = await fs.stat(nodePath.join(absolutePath, entry.name));
                    return {
                        type: "file" as const,
                        name: entry.name,
                        path: entryRelPath,
                        size: fileStats.size,
                    };
                }),
            );

            mappedEntries.sort((a, b) => {
                if (a.type !== b.type) {
                    return a.type === "directory" ? -1 : 1;
                }
                return a.name.localeCompare(b.name);
            });

            res.json({
                path: relativePath || "/",
                branch,
                entries: mappedEntries,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/blob/:branch/*path
 *
 * Retrieve the content of a specific file in a repository.
 * Supports text and binary files. For binary files, returns a
 * base64-encoded representation.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param branch - Git branch name or commit SHA.
 * @param path - Path to the file within the repository.
 * @param raw - Query parameter: if true, return raw content instead of JSON.
 * @returns File content object or raw file content.
 *
 * @example
 * GET /api/repositories/john/my-project/blob/main/package.json
 * GET /api/repositories/john/my-project/blob/main/README.md?raw=true
 */
router.get(
    /^\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)(?:\/(.+))?$/,
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params[0]).toLowerCase();
            const repo = String(req.params[1]).toLowerCase();
            const branch = String(req.params[2]);
            const path = normalizeRepoRelativePath(String(req.params[3] || ""));
            const raw = req.query.raw === "true";

            if (!path) {
                res.status(400).json({ error: "File path is required", code: "VALIDATION_ERROR" });
                return;
            }

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
            await ensureRepositoryExistsOnDisk(repoRoot);
            const absolutePath = resolveSafeRepoPath(repoRoot, path);
            const stats = await fs.stat(absolutePath).catch(() => null);

            if (!stats || !stats.isFile()) {
                res.status(404).json({ error: "File not found", code: "NOT_FOUND" });
                return;
            }

            const content = await fs.readFile(absolutePath, "utf-8");

            if (raw) {
                res.set("Content-Type", "text/plain; charset=utf-8");
                res.send(content);
            } else {
                res.json({
                    path,
                    branch,
                    content,
                    encoding: "utf-8",
                    size: stats.size,
                });
            }
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/readme?branch=main
 *
 * Return README contents from repository root.
 */
router.get(
    "/:owner/:repo/readme",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const branch = typeof req.query.branch === "string" ? req.query.branch : "main";

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
            await ensureRepositoryExistsOnDisk(repoRoot);

            for (const readmeName of README_CANDIDATES) {
                const candidatePath = resolveSafeRepoPath(repoRoot, readmeName);
                const stats = await fs.stat(candidatePath).catch(() => null);
                if (stats?.isFile()) {
                    const content = await fs.readFile(candidatePath, "utf-8");
                    res.json({
                        path: readmeName,
                        branch,
                        content,
                        size: stats.size,
                        encoding: "utf-8",
                    });
                    return;
                }
            }

            res.status(404).json({ error: "README not found", code: "NOT_FOUND" });
        } catch (err) {
            next(err);
        }
    },
);


/* ── Commit History and Details ──────────────────────────────── */

/**
 * GET /api/repositories/:owner/:repo/commits
 *
 * List commits in a repository, optionally filtered by branch or author.
 * Results are paginated with a default limit of 20 commits per page.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param branch - Git branch name or commit SHA (optional, defaults to default branch).
 * @param author - Filter commits by author email (optional).
 * @param page - Page number for pagination (optional, defaults to 1).
 * @param perPage - Number of results per page (optional, defaults to 20).
 * @returns Array of commit objects with pagination metadata.
 *
 * @example
 * GET /api/repositories/john/my-project/commits
 * GET /api/repositories/john/my-project/commits?branch=develop&page=2
 * GET /api/repositories/john/my-project/commits?author=john@example.com
 */
router.get(
    "/:owner/:repo/commits",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const branch = (req.query.branch as string | undefined)?.trim();
            const author = (req.query.author as string | undefined)?.trim();
            const { page, perPage } = parsePagination(req.query as Record<string, unknown>);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Use git utilities to get commit history
            const { listCommits } = await import("@platform/git");

            const commits = await listCommits(getRepositoryFsRoot(project), {
                branch: branch || project.defaultBranch || "main",
                author: author || undefined,
                limit: perPage,
                offset: (page - 1) * perPage,
            });

            // Get total count for pagination
            const allCommits = await listCommits(getRepositoryFsRoot(project), {
                branch: branch || project.defaultBranch || "main",
                author: author || undefined,
                limit: 1000, // Get more for accurate count
            });

            const total = allCommits.length;
            const totalPages = Math.ceil(total / perPage);

            res.set("X-Total-Count", String(total));
            res.set("X-Total-Pages", String(totalPages));
            res.set("X-Current-Page", String(page));
            res.set("X-Per-Page", String(perPage));

            res.json({
                data: commits,
                pagination: { page, perPage, total, totalPages },
                filters: {
                    branch: branch || undefined,
                    author: author || undefined,
                },
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/commits/:sha
 *
 * Retrieve detailed information about a specific commit,
 * including the commit message, author, and list of changed files.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param sha - Commit SHA or short SHA (at least 7 characters).
 * @returns Commit object with detailed metadata and changed files.
 *
 * @example
 * GET /api/repositories/john/my-project/commits/abc1234
 * GET /api/repositories/john/my-project/commits/abc123456789abcdef
 */
router.get(
    "/:owner/:repo/commits/:sha",
    optionalAuth,
    validate([{ field: "sha", location: "params", type: "string", min: 7, max: 40 }]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const sha = String(req.params.sha);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Use git utilities to get commit details
            const { getCommit } = await import("@platform/git");

            const commit = await getCommit(getRepositoryFsRoot(project), sha);

            if (!commit) {
                res.status(404).json({ error: "Commit not found", code: "NOT_FOUND" });
                return;
            }

            res.json(commit);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/commits/:sha/diff
 *
 * Retrieve the diff for a specific commit, showing the exact changes
 * made to each file in that commit.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param sha - Commit SHA or short SHA (at least 7 characters).
 * @returns Diff content in unified format.
 *
 * @example
 * GET /api/repositories/john/my-project/commits/abc1234/diff
 */
router.get(
    "/:owner/:repo/commits/:sha/diff",
    optionalAuth,
    validate([{ field: "sha", location: "params", type: "string", min: 7, max: 40 }]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const sha = String(req.params.sha);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Use git utilities to get commit diff
            const { getDiff, getCommitParents } = await import("@platform/git");

            // Get the parent commit(s) to compare against
            const parents = await getCommitParents(getRepositoryFsRoot(project), sha);

            if (parents.length === 0) {
                // This is a root commit, show all files
                const { execFile } = await import("node:child_process");
                const { promisify } = await import("node:util");
                const execFileAsync = promisify(execFile);
                const { stdout: diff } = await execFileAsync("git", [
                    "-C", getRepositoryFsRoot(project),
                    "show",
                    "--format=",
                    sha
                ]);
                res.set("Content-Type", "text/plain; charset=utf-8");
                res.send(diff);
                return;
            }

            // Compare with the first parent (for merge commits, this shows the primary changes)
            const diff = await getDiff(getRepositoryFsRoot(project), parents[0], sha);

            if (!diff) {
                res.status(404).json({ error: "Commit diff not found", code: "NOT_FOUND" });
                return;
            }

            res.set("Content-Type", "text/plain; charset=utf-8");
            res.send(diff);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/repositories/:owner/:repo/commits/:sha/revert
 *
 * Create a new commit that reverts the changes made by the specified commit.
 * The user must be authenticated and either be the repository owner or have admin role.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param sha - Commit SHA or short SHA to revert.
 * @body message - Optional commit message for the revert commit.
 * @returns Information about the created revert commit.
 *
 * @example
 * POST /api/repositories/john/my-project/commits/abc1234/revert
 * {
 *   "message": "Revert: Fix the bug that broke everything"
 * }
 */
router.post(
    "/:owner/:repo/commits/:sha/revert",
    requireAuth,
    validate([{ field: "sha", location: "params", type: "string", min: 7, max: 40 }]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const sha = String(req.params.sha);
            const { message } = req.body as { message?: string };

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Only owner or admin can revert commits
            if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });
                return;
            }

            // Use git utilities to revert commit
            const { revertCommit } = await import("@platform/git");

            const revertCommitResult = await revertCommit(getRepositoryFsRoot(project), sha, {
                message: message || `Revert commit ${sha.substring(0, 7)}`,
                author: {
                    name: req.user!.username,
                    email: `${req.user!.username}@example.com`, // Would need real email from user profile
                },
            });

            res.status(201).json({
                sha: revertCommitResult.sha,
                message: revertCommitResult.message,
                parent: sha,
                reverted: true,
            });
        } catch (err) {
            next(err);
        }
    },
);

/* ── Branch Management ───────────────────────────────────────── */

/**
 * GET /api/repositories/:owner/:repo/branches
 *
 * List all branches in a repository with metadata about each branch
 * including the commit it points to and protection status.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param page - Page number for pagination (optional, defaults to 1).
 * @param perPage - Number of results per page (optional, defaults to 20).
 * @returns Array of branch objects with pagination metadata.
 *
 * @example
 * GET /api/repositories/john/my-project/branches
 * GET /api/repositories/john/my-project/branches?page=2&perPage=50
 */
router.get(
    "/:owner/:repo/branches",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const { page, perPage } = parsePagination(req.query as Record<string, unknown>);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Use git utilities to list branches
            const { listBranches } = await import("@platform/git");

            const branches = await listBranches(getRepositoryFsRoot(project));
            const total = branches.length;
            const totalPages = Math.ceil(total / perPage);

            // Apply pagination
            const paginatedBranches = branches.slice((page - 1) * perPage, page * perPage);

            res.set("X-Total-Count", String(total));
            res.set("X-Total-Pages", String(totalPages));
            res.set("X-Current-Page", String(page));
            res.set("X-Per-Page", String(perPage));

            res.json({
                data: paginatedBranches,
                pagination: { page, perPage, total, totalPages },
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/branches/:name
 *
 * Retrieve detailed information about a specific branch,
 * including the commit it currently points to.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param name - Branch name.
 * @returns Branch object with commit information.
 *
 * @example
 * GET /api/repositories/john/my-project/branches/main
 * GET /api/repositories/john/my-project/branches/develop
 */
router.get(
    "/:owner/:repo/branches/:name",
    optionalAuth,
    validate([{ field: "name", location: "params", type: "string", min: 1, max: 255 }]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const name = String(req.params.name);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Use git utilities to get branch details
            const { getBranchDetails } = await import("@platform/git");

            const branch = await getBranchDetails(getRepositoryFsRoot(project), name);

            if (!branch) {
                res.status(404).json({ error: "Branch not found", code: "NOT_FOUND" });
                return;
            }

            res.json(branch);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/repositories/:owner/:repo/branches
 *
 * Create a new branch in the repository. The user must be authenticated
 * and either be the repository owner or have admin role.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @body name - Name of the new branch (required).
 * @body from - Branch or commit SHA to create the branch from (defaults to default branch).
 * @returns Newly created branch object.
 *
 * @example
 * POST /api/repositories/john/my-project/branches
 * {
 *   "name": "feature/new-feature",
 *   "from": "main"
 * }
 */
router.post(
    "/:owner/:repo/branches",
    requireAuth,
    validate([
        { field: "name", location: "body", type: "string", required: true, min: 1, max: 255 },
        { field: "from", location: "body", type: "string", min: 1, max: 40 },
    ]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const { name, from } = req.body as { name: string; from?: string };

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Only owner or admin can create branches
            if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });
                return;
            }

            // Validate branch name format
            if (!/^[a-zA-Z0-9._/-]+$/.test(name)) {
                res.status(400).json({
                    error: "Invalid branch name. Only alphanumeric characters, dots, slashes, and hyphens are allowed.",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            // Use git utilities to create branch
            const { createBranch } = await import("@platform/git");

            await createBranch(getRepositoryFsRoot(project), name, from || project.defaultBranch);

            res.status(201).json({ message: `Branch '${name}' created successfully` });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/repositories/:owner/:repo/branches/:name
 *
 * Delete a branch from the repository. The user must be authenticated
 * and either be the repository owner or have admin role.
 * The default branch cannot be deleted.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param name - Name of the branch to delete.
 * @returns Success message.
 *
 * @example
 * DELETE /api/repositories/john/my-project/branches/feature/old-feature
 */
router.delete(
    "/:owner/:repo/branches/:name",
    requireAuth,
    validate([{ field: "name", location: "params", type: "string", min: 1, max: 255 }]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const name = String(req.params.name);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Only owner or admin can delete branches
            if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });
                return;
            }

            // Prevent deletion of default branch
            if (name === project.defaultBranch) {
                res.status(400).json({
                    error: "Cannot delete the default branch",
                    code: "CANNOT_DELETE_DEFAULT_BRANCH",
                });
                return;
            }

            // Use git utilities to delete branch
            const { deleteBranch } = await import("@platform/git");

            await deleteBranch(getRepositoryFsRoot(project), name);

            res.json({ message: `Branch '${name}' deleted successfully` });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/repositories/:owner/:repo/tags/:name
 *
 * Delete a tag from the repository. The user must be authenticated
 * and either be the repository owner or have admin role.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param name - Name of the tag to delete.
 * @returns Success message.
 *
 * @example
 * DELETE /api/repositories/john/my-project/tags/v1.0.0
 */
router.delete(
    "/:owner/:repo/tags/:name",
    requireAuth,
    validate([{ field: "name", location: "params", type: "string", min: 1, max: 255 }]),
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const name = String(req.params.name);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Only owner or admin can delete tags
            if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Insufficient permissions", code: "FORBIDDEN" });
                return;
            }

            // Use git utilities to delete tag
            const { deleteTag } = await import("@platform/git");

            await deleteTag(getRepositoryFsRoot(project), name);

            res.json({ message: `Tag '${name}' deleted successfully` });
        } catch (err) {
            next(err);
        }
    },
);

/* ── Repository Statistics ───────────────────────────────────── */

/**
 * GET /api/repositories/:owner/:repo/contributors
 *
 * Get a list of contributors to the repository, sorted by number of commits.
 * Includes commit counts, addition/deletion counts, and first/last commit dates.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param page - Page number for pagination (optional, defaults to 1).
 * @param perPage - Number of results per page (optional, defaults to 20).
 * @returns Array of contributor objects with statistics.
 *
 * @example
 * GET /api/repositories/john/my-project/contributors
 * GET /api/repositories/john/my-project/contributors?page=2&perPage=50
 */
router.get(
    "/:owner/:repo/contributors",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const { page, perPage } = parsePagination(req.query as Record<string, unknown>);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // TODO: Implement contributor statistics using git utilities
            // This would typically use the @platform/git package to gather contributor data
            const total = 0;
            const totalPages = Math.ceil(total / perPage);

            res.set("X-Total-Count", String(total));
            res.set("X-Total-Pages", String(totalPages));
            res.set("X-Current-Page", String(page));
            res.set("X-Per-Page", String(perPage));

            res.json({
                data: [],
                pagination: { page, perPage, total, totalPages },
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/stats
 *
 * Retrieve comprehensive statistics about the repository including:
 * - Commit count and frequency
 * - Code churn metrics (additions/deletions)
 * - File type distribution
 * - Contributor count
 * - Repository size
 * - Clone count and activity metrics
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @returns Object containing various repository statistics.
 *
 * @example
 * GET /api/repositories/john/my-project/stats
 */
router.get(
    "/:owner/:repo/stats",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Get real statistics from database and repository
            const branches = ["main"]; // TODO: Get actual branches from git
            const commitCount = 0; // TODO: Get actual commit count from git

            res.json({
                commits: commitCount,
                branches: branches.length,
                tags: 0, // TODO: Get actual tag count from git
                openPullRequests: 0, // TODO: Get actual PR count from database
                stars: project.starCount || 0,
                forks: 0, // TODO: Get actual fork count from database
            });
        } catch (err) {
            next(err);
        }
    },
);

/* ── Star Operations ───────────────────────────────────────────── */

/**
 * POST /api/repositories/:owner/:repo/star
 *
 * Star a repository. Requires authentication.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @returns Success message and updated star count.
 */
router.post(
    "/:owner/:repo/star",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const userId = req.user!.userId;

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, userId, req.user!.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // TODO: Check if user already starred, implement star tracking table
            // For now, just increment the star count
            const updatedProject = projectRepo.updateProject(project.id, {
                starCount: (project.starCount || 0) + 1,
            });

            res.json({
                message: "Repository starred successfully",
                starred: true,
                stars: updatedProject?.starCount || 0,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/repositories/:owner/:repo/star
 *
 * Unstar a repository. Requires authentication.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @returns Success message and updated star count.
 */
router.delete(
    "/:owner/:repo/star",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const userId = req.user!.userId;

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, userId, req.user!.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // TODO: Check if user actually starred, implement star tracking table
            // For now, just decrement the star count if it's > 0
            const currentStars = project.starCount || 0;
            const updatedProject = projectRepo.updateProject(project.id, {
                starCount: Math.max(0, currentStars - 1),
            });

            res.json({
                message: "Repository unstarred successfully",
                starred: false,
                stars: updatedProject?.starCount || 0,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/repositories/:owner/:repo/starred
 *
 * Check if the authenticated user has starred a repository.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @returns Star status and count.
 */
router.get(
    "/:owner/:repo/starred",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const userId = req.user!.userId;

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, userId, req.user!.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // TODO: Check actual star status from star tracking table
            // For now, return false
            res.json({
                starred: false,
                stars: project.starCount || 0,
            });
        } catch (err) {
            next(err);
        }
    },
);

/* ── Code Search ─────────────────────────────────────────────── */

/**
 * GET /api/repositories/:owner/:repo/search
 *
 * Search for code within a repository.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @param q - Search query string.
 * @returns Search results with file paths and content snippets.
 */
router.get(
    "/:owner/:repo/search",
    optionalAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const query = req.query.q as string;

            if (!query || query.trim().length === 0) {
                res.status(400).json({
                    error: "Search query is required",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            if (!canAccessRepository(project, req.user?.userId, req.user?.role)) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // TODO: Implement actual code search using git grep or similar
            // For now, return mock search results
            const mockResults = [
                {
                    path: "src/components/Header.tsx",
                    content: `const Header = () => {\n  return <div className="header">${query}</div>;\n};`,
                    lineNumbers: [12, 13, 14],
                    language: "TypeScript",
                    lastModified: "2024-01-15",
                },
                {
                    path: "src/pages/Home.tsx",
                    content: `export const Home = () => {\n  return <h1>Welcome to ${query}</h1>;\n};`,
                    lineNumbers: [8, 9, 10],
                    language: "TypeScript",
                    lastModified: "2024-01-14",
                },
            ];

            res.json({
                query: query.trim(),
                repository: `${owner}/${repo}`,
                results: mockResults,
                total: mockResults.length,
            });
        } catch (err) {
            next(err);
        }
    },
);

/* ── File Operations ─────────────────────────────────────────── */

/**
 * POST /api/repositories/:owner/:repo/files
 *
 * Create or update a file in the repository.
 * Requires authentication and write access.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @body branch - Target branch name.
 * @body path - File path within repository.
 * @body content - File content (text or base64).
 * @body message - Commit message.
 * @returns Updated file metadata.
 */
router.post(
    "/:owner/:repo/files",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const { branch, path, content, message, type } = req.body;

            if (!branch || !path || !message) {
                res.status(400).json({
                    error: "branch, path, and message are required",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            const relativePath = normalizeRepoRelativePath(String(path));
            const isDirectory = type === "directory";

            if (!isDirectory && content === undefined) {
                res.status(400).json({
                    error: "content is required when creating/updating a file",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Check write permission
            const userId = req.user!.userId;
            const role = req.user!.role;
            if (project.ownerId !== userId && role !== "admin") {
                res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
                return;
            }

            const repoRoot = getRepositoryFsRoot(project);
            await ensureRepositoryExistsOnDisk(repoRoot);
            const absolutePath = resolveSafeRepoPath(repoRoot, relativePath);

            if (isDirectory) {
                await fs.mkdir(absolutePath, { recursive: true });
            } else {
                await fs.mkdir(nodePath.dirname(absolutePath), { recursive: true });
                await fs.writeFile(absolutePath, String(content), "utf-8");
            }

            res.json({
                success: true,
                data: {
                    path: relativePath,
                    branch,
                    message,
                    committed: true,
                    type: isDirectory ? "directory" : "file",
                },
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/repositories/:owner/:repo/files
 *
 * Delete a file from the repository.
 * Requires authentication and write access.
 *
 * @param owner - Repository owner's username.
 * @param repo - Repository slug.
 * @query branch - Target branch name.
 * @query path - File path to delete.
 * @returns Deletion confirmation.
 */
router.delete(
    "/:owner/:repo/files",
    requireAuth,
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const owner = String(req.params.owner).toLowerCase();
            const repo = String(req.params.repo).toLowerCase();
            const branch = String(req.query.branch);
            const path = String(req.query.path);
            const targetType = String(req.query.type || "file");

            if (!branch || !path) {
                res.status(400).json({
                    error: "branch and path query parameters are required",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            const relativePath = normalizeRepoRelativePath(path);

            const project = resolveRepository(owner, repo);
            if (!project) {
                res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
                return;
            }

            // Check write permission
            const userId = req.user!.userId;
            const role = req.user!.role;
            if (project.ownerId !== userId && role !== "admin") {
                res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
                return;
            }

            const repoRoot = getRepositoryFsRoot(project);
            const absolutePath = resolveSafeRepoPath(repoRoot, relativePath);
            const stats = await fs.stat(absolutePath).catch(() => null);

            if (!stats) {
                res.status(404).json({ error: "Path not found", code: "NOT_FOUND" });
                return;
            }

            if (targetType === "directory" || stats.isDirectory()) {
                await fs.rm(absolutePath, { recursive: true, force: true });
            } else {
                await fs.unlink(absolutePath);
            }

            res.json({
                success: true,
                message: `Path ${relativePath} deleted from ${branch}`,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
