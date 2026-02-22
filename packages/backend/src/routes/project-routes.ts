import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import { getConfig } from "../config/app-config.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as searchRepo from "../db/repositories/search-repo.js";

/**
 * Project CRUD routes.
 *
 * Manages project creation, listing, updating, deletion, forking,
 * and statistics retrieval.
 */
const router = Router();

/** Default and maximum pagination values. */
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * Clamp pagination params to safe ranges.
 */
function parsePagination(query: Record<string, unknown>): { page: number; perPage: number } {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(query.perPage) || DEFAULT_PER_PAGE));
    return { page, perPage };
}

/**
 * Check whether the requesting user can view a private project.
 */
function canViewPrivate(project: ReturnType<typeof projectRepo.findById>, userId?: string): boolean {
    if (!project) return false;
    if (!project.isPrivate) return true;
    if (!userId) return false;
    return project.ownerId === userId;
}

/**
 * GET /api/projects
 *
 * Lists public projects with optional search and pagination.
 * Authenticated users can additionally see their own private projects.
 */
router.get("/", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
        const q = (req.query.q as string | undefined)?.trim();

        let projects;
        if (q) {
            projects = projectRepo.searchProjects(q, { page, perPage });
        } else {
            const includePrivate = req.user?.role === "admin";
            projects = projectRepo.listProjects({ page, perPage }, includePrivate);
        }

        res.json({
            data: projects,
            pagination: { page, perPage },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/projects
 *
 * Creates a new project owned by the authenticated user.
 */
router.post(
    "/",
    requireAuth,
    validate([
        { field: "name", location: "body", required: true, type: "string", min: 1, max: 100 },
        { field: "slug", location: "body", type: "string", min: 1, max: 100, pattern: /^[a-z0-9_-]+$/ },
        { field: "description", location: "body", type: "string", max: 1000 },
        { field: "isPrivate", location: "body", type: "boolean" },
        { field: "defaultBranch", location: "body", type: "string", max: 255 },
    ]),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const config = getConfig();
            const userId = req.user!.userId;

            // Auto-generate slug from name if not provided
            const slug = req.body.slug || req.body.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9_-]/g, "");

            if (!slug || slug.length === 0) {
                res.status(400).json({
                    error: "Could not generate valid slug from project name",
                    code: "INVALID_SLUG",
                });
                return;
            }

            // Check per-user repo limit
            const owned = projectRepo.findByOwner(userId, { page: 1, perPage: 1 });
            const total = owned.length; // rough check
            if (total >= config.maxReposPerUser) {
                res.status(403).json({
                    error: `Maximum number of repositories (${config.maxReposPerUser}) reached`,
                    code: "REPO_LIMIT_EXCEEDED",
                });
                return;
            }

            // Check slug uniqueness for this owner
            const existing = projectRepo.findBySlug(userId, slug);
            if (existing) {
                res.status(409).json({ error: "Project slug already exists", code: "CONFLICT" });
                return;
            }

            const storagePath = `${config.dataDir}/repos/${userId}/${slug}.git`;

            const project = projectRepo.createProject({
                name: req.body.name,
                slug: slug,
                ownerId: userId,
                storagePath,
                description: req.body.description,
                orgId: req.body.orgId,
                isPrivate: req.body.isPrivate,
                defaultBranch: req.body.defaultBranch,
            });

            // Index in search
            searchRepo.index({
                entityId: project.id,
                type: "repo",
                title: project.name,
                content: [project.name, project.slug, project.description ?? ""].join(" "),
            });

            res.status(201).json(project);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/projects/:id
 *
 * Returns a single project by ID.
 * Private projects require the owner or admin.
 */
router.get("/:id", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = projectRepo.findById(String(req.params.id));
        if (!project) {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        if (!canViewPrivate(project, req.user?.userId) && req.user?.role !== "admin") {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        // Resolve owner username for display
        const owner = userRepo.findById(project.ownerId);

        res.json({
            ...project,
            owner: owner ? { id: owner.id, username: owner.username, avatarUrl: owner.avatarUrl } : null,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/projects/:id
 *
 * Updates a project. Only the owner or an admin can modify it.
 */
router.patch(
    "/:id",
    requireAuth,
    validate([
        { field: "name", location: "body", type: "string", min: 1, max: 100 },
        { field: "description", location: "body", type: "string", max: 1000 },
        { field: "isPrivate", location: "body", type: "boolean" },
        { field: "defaultBranch", location: "body", type: "string", max: 255 },
    ]),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const project = projectRepo.findById(String(req.params.id));
            if (!project) {
                res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
                return;
            }

            if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
                return;
            }

            const updated = projectRepo.updateProject(String(req.params.id), {
                name: req.body.name,
                description: req.body.description,
                isPrivate: req.body.isPrivate,
                defaultBranch: req.body.defaultBranch,
            });

            // Re-index
            if (updated) {
                searchRepo.index({
                    entityId: updated.id,
                    type: "repo",
                    title: updated.name,
                    content: [updated.name, updated.slug, updated.description ?? ""].join(" "),
                });
            }

            res.json(updated);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/projects/:id
 *
 * Deletes a project. Only the owner or an admin can delete.
 */
router.delete("/:id", requireAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = projectRepo.findById(String(req.params.id));
        if (!project) {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
            res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
            return;
        }

        searchRepo.remove(project.id);
        projectRepo.deleteProject(String(req.params.id));

        res.json({ message: "Project deleted successfully" });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/projects/:id/fork
 *
 * Forks a project for the authenticated user.
 */
router.post("/:id/fork", requireAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const source = projectRepo.findById(String(req.params.id));
        if (!source) {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        if (source.isPrivate && source.ownerId !== req.user!.userId && req.user!.role !== "admin") {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        const config = getConfig();
        const userId = req.user!.userId;
        const newSlug = req.body.slug ?? source.slug;

        // Check for slug conflict
        const conflict = projectRepo.findBySlug(userId, newSlug);
        if (conflict) {
            res.status(409).json({ error: "You already have a project with this slug", code: "CONFLICT" });
            return;
        }

        const storagePath = `${config.dataDir}/repos/${userId}/${newSlug}.git`;
        const forked = projectRepo.forkProject(source.id, userId, newSlug, storagePath);
        if (!forked) {
            res.status(500).json({ error: "Fork failed", code: "INTERNAL_ERROR" });
            return;
        }

        // Index the fork
        searchRepo.index({
            entityId: forked.id,
            type: "repo",
            title: forked.name,
            content: [forked.name, forked.slug, forked.description ?? ""].join(" "),
        });

        res.status(201).json(forked);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/projects/:id/stats
 *
 * Returns statistics for a project.
 */
router.get("/:id/stats", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const project = projectRepo.findById(String(req.params.id));
        if (!project) {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        if (!canViewPrivate(project, req.user?.userId) && req.user?.role !== "admin") {
            res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
            return;
        }

        res.json({
            id: project.id,
            name: project.name,
            cloneCount: project.cloneCount,
            starCount: project.starCount,
            isForked: !!project.forkedFromId,
            forkedFromId: project.forkedFromId ?? null,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
        });
    } catch (err) {
        next(err);
    }
});

export default router;
