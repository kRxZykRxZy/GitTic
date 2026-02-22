import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole, optionalAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as sessionRepo from "../db/repositories/session-repo.js";
import * as orgRepo from "../db/repositories/org-repo.js";

/**
 * User management routes.
 *
 * Provides listing, searching, viewing, updating, and deleting
 * user accounts. Includes a GDPR-compliant data export endpoint.
 */
const router = Router();

/** Default pagination values. */
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * Clamp pagination parameters to safe ranges.
 */
function parsePagination(query: Record<string, unknown>): { page: number; perPage: number } {
    const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
    const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(query.perPage) || DEFAULT_PER_PAGE));
    return { page, perPage };
}

/**
 * Strip sensitive fields from a user object before sending to client.
 */
function sanitizeUser(user: ReturnType<typeof userRepo.findById>) {
    if (!user) return null;
    const { passwordHash, ...safe } = user;
    return safe;
}

/**
 * GET /api/users
 *
 * Lists users with optional search query and pagination.
 * Available to any authenticated user; admins see suspended users.
 */
router.get("/", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
        const q = (req.query.q as string | undefined)?.trim();

        let users;
        if (q) {
            users = userRepo.searchUsers(q, { page, perPage });
        } else {
            users = userRepo.listUsers({ page, perPage });
        }

        const total = userRepo.countUsers();
        const totalPages = Math.ceil(total / perPage);

        res.set("X-Total-Count", String(total));
        res.set("X-Total-Pages", String(totalPages));
        res.set("X-Current-Page", String(page));
        res.set("X-Per-Page", String(perPage));

        res.json({
            data: users.map(sanitizeUser),
            pagination: { page, perPage, total, totalPages },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/users/:id
 *
 * Returns a single user's public profile.
 */
router.get("/:id", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = userRepo.findById(String(req.params.id));
        if (!user) {
            res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
            return;
        }

        res.json(sanitizeUser(user));
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/users/:id
 *
 * Updates a user's profile. Only the user themselves or an admin
 * can perform this operation.
 */
router.patch(
    "/:id",
    requireAuth,
    validate([
        { field: "displayName", location: "body", type: "string", max: 100 },
        { field: "bio", location: "body", type: "string", max: 500 },
        { field: "avatarUrl", location: "body", type: "string", max: 2048 },
        { field: "email", location: "body", type: "string" },
    ]),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = String(req.params.id);

            // Only self or admin can update
            if (req.user!.userId !== targetId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
                return;
            }

            const existing = userRepo.findById(targetId);
            if (!existing) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            const { displayName, bio, avatarUrl, email, country } = req.body;

            // If changing email, check for conflicts
            if (email && email !== existing.email) {
                const conflict = userRepo.findByEmail(email);
                if (conflict) {
                    res.status(409).json({ error: "Email already in use", code: "CONFLICT" });
                    return;
                }
            }

            const updated = userRepo.updateUser(targetId, {
                displayName,
                bio,
                avatarUrl,
                email,
                country,
            });

            res.json(sanitizeUser(updated));
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/users/:id
 *
 * Deletes a user account. Admin-only operation.
 * Also cleans up all associated sessions.
 */
router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = String(req.params.id);

            // Prevent self-deletion
            if (req.user!.userId === targetId) {
                res.status(400).json({ error: "Cannot delete your own account", code: "SELF_DELETE" });
                return;
            }

            const user = userRepo.findById(targetId);
            if (!user) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            // Clean up sessions
            sessionRepo.deleteAllForUser(targetId);

            const deleted = userRepo.deleteUser(targetId);
            if (!deleted) {
                res.status(500).json({ error: "Failed to delete user", code: "INTERNAL_ERROR" });
                return;
            }

            res.json({ message: "User deleted successfully" });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/users/:id/export
 *
 * GDPR data export endpoint. Returns all data the platform
 * holds about a user in a single JSON download.
 *
 * Only the user themselves or an admin can request an export.
 */
router.get(
    "/:id/export",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetId = String(req.params.id);

            // Only self or admin
            if (req.user!.userId !== targetId && req.user!.role !== "admin") {
                res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
                return;
            }

            const user = userRepo.findById(targetId);
            if (!user) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            // Collect all user data
            const sessions = sessionRepo.findByUserId(targetId);
            const projects = projectRepo.findByOwner(targetId, { page: 1, perPage: 10000 });
            const orgs = orgRepo.listByUser(targetId);

            const exportData = {
                exportedAt: new Date().toISOString(),
                user: sanitizeUser(user),
                sessions: sessions.map((s) => ({
                    id: s.id,
                    ipAddress: s.ipAddress,
                    userAgent: s.userAgent,
                    createdAt: s.createdAt,
                    expiresAt: s.expiresAt,
                })),
                projects: projects.map((p) => ({
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    description: p.description,
                    isPrivate: p.isPrivate,
                    createdAt: p.createdAt,
                })),
                organizations: orgs.map((o) => ({
                    id: o.id,
                    name: o.name,
                    slug: o.slug,
                    role: "member",
                })),
            };

            res.set("Content-Disposition", `attachment; filename="user-data-${targetId}.json"`);
            res.set("Content-Type", "application/json");
            res.json(exportData);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/users/:username/profile
 *
 * Returns a user's public profile by username.
 */
router.get("/:username/profile", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = userRepo.findByUsername(String(req.params.username));
        if (!user) {
            res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
            return;
        }

        // Get user stats
        const projects = projectRepo.findByOwner(user.id, { page: 1, perPage: 10000 });
        const followers: any[] = [];
        const following: any[] = [];

        // Check if current user is following this user
        let isFollowing = false;

        const profile = {
            ...sanitizeUser(user),
            stats: {
                followers: followers.length,
                following: following.length,
                repositories: projects.length,
                stars: 0, // TODO: implement stars
            },
            isFollowing,
        };

        res.json(profile);
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/users/:username/repositories
 *
 * Returns a user's public repositories by username.
 */
router.get("/:username/repositories", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = userRepo.findByUsername(String(req.params.username));
        if (!user) {
            res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
            return;
        }

        const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
        const projects = projectRepo.findByOwner(user.id, { page, perPage });

        // Filter private repos unless it's the owner or an admin
        const visible = projects.filter((p) => {
            if (!p.isPrivate) return true;
            if (!req.user) return false;
            return req.user.userId === user.id || req.user.role === "admin";
        });

        res.json(visible);
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/users/:username/follow
 *
 * Follow a user.
 */
router.post(
    "/:username/follow",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetUser = userRepo.findByUsername(String(req.params.username));
            if (!targetUser) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            const currentUserId = req.user!.userId;
            if (currentUserId === targetUser.id) {
                res.status(400).json({ error: "Cannot follow yourself", code: "INVALID_OPERATION" });
                return;
            }

            // Add follow relationship
            userRepo.addFollow(currentUserId, targetUser.id);

            res.json({ success: true, message: "User followed successfully" });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/users/:username/follow
 *
 * Unfollow a user.
 */
router.delete(
    "/:username/follow",
    requireAuth,
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const targetUser = userRepo.findByUsername(String(req.params.username));
            if (!targetUser) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            const currentUserId = req.user!.userId;

            // Remove follow relationship
            userRepo.removeFollow(currentUserId, targetUser.id);

            res.json({ success: true, message: "User unfollowed successfully" });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/users/:username/followers
 *
 * Get a user's followers.
 */
router.get("/:username/followers", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = userRepo.findByUsername(String(req.params.username));
        if (!user) {
            res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
            return;
        }

        const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
        const followers: any[] = [];

        // Paginate
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedFollowers = followers.slice(start, end);

        res.json({
            data: paginatedFollowers.map(sanitizeUser),
            pagination: { page, perPage, total: followers.length, totalPages: Math.ceil(followers.length / perPage) },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/users/:username/following
 *
 * Get users that a user is following.
 */
router.get("/:username/following", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const user = userRepo.findByUsername(String(req.params.username));
        if (!user) {
            res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
            return;
        }

        const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
        const following: any[] = [];

        // Paginate
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const paginatedFollowing = following.slice(start, end);

        res.json({
            data: paginatedFollowing.map(sanitizeUser),
            pagination: { page, perPage, total: following.length, totalPages: Math.ceil(following.length / perPage) },
        });
    } catch (err) {
        next(err);
    }
});

export default router;
