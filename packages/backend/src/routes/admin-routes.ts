import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth-guard.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as sessionRepo from "../db/repositories/session-repo.js";
import * as analyticsRepo from "../db/repositories/analytics-repo.js";
import * as moderationRepo from "../db/repositories/moderation-repo.js";
import * as featureRepo from "../db/repositories/feature-repo.js";
import * as clusterRepo from "../db/repositories/cluster-repo.js";
import { getActiveConnectionCount } from "../services/websocket-gateway.js";
import { getMetrics } from "../services/metrics-collector.js";

/**
 * Admin-only routes.
 *
 * Provides a comprehensive dashboard, full user management,
 * analytics data for charts, feature flag management,
 * announcements, and cluster force-update capability.
 */
const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireRole("admin"));

/**
 * GET /api/admin/dashboard
 *
 * Returns a high-level statistics overview for the admin dashboard.
 * Aggregates user counts, project counts, session counts,
 * open moderation reports, and cluster node status.
 */
router.get("/dashboard", (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = Math.min(90, Math.max(7, Number(req.query.days) || 30));
        const totalUsers = userRepo.countUsers();
        const totalProjects = projectRepo.countProjects();
        const nodes = clusterRepo.listNodes();
        const wsConnections = getActiveConnectionCount();
        const snapshot = analyticsRepo.getAdminDashboardSnapshot(days);

        const data = {
            totalUsers,
            totalProjects,
            totalClusters: nodes.length,
            activeConnections: wsConnections,
            userGrowth: analyticsRepo.getUserGrowth(days).map((point) => ({
                label: point.label,
                value: point.count,
                timestamp: `${point.label}T00:00:00.000Z`,
            })),
            projectTrends: snapshot.repoCreations,
            eventTotals: {
                totalLogins: snapshot.totalLogins,
                totalPushes: snapshot.totalPushes,
                totalPrsOpened: snapshot.totalPrsOpened,
                totalIssuesOpened: snapshot.totalIssuesOpened,
                totalIssuesClosed: snapshot.totalIssuesClosed,
            },
        };

        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/admin/users
 *
 * Full user listing with search for admin user management.
 * Returns all fields including suspension status.
 */
router.get("/users", (req: Request, res: Response, next: NextFunction) => {
    try {
        const page = Math.max(1, Number(req.query.page) || 1);
        const perPage = Math.min(100, Math.max(1, Number(req.query.perPage) || 20));
        const q = (req.query.q as string | undefined)?.trim();

        let users;
        if (q) {
            users = userRepo.searchUsers(q, { page, perPage });
        } else {
            users = userRepo.listUsers({ page, perPage });
        }

        const total = userRepo.countUsers();

        res.json({
            data: users.map((u) => {
                const { passwordHash, ...safe } = u;
                return safe;
            }),
            pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/admin/users/:id/role
 *
 * Updates a user's role (user, moderator, admin).
 */
router.patch(
    "/users/:id/role",
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const { role } = req.body;
            if (!role || !["user", "moderator", "admin"].includes(role)) {
                res.status(400).json({ error: "Invalid role", code: "VALIDATION_ERROR" });
                return;
            }

            // Prevent demoting yourself
            if (String(req.params.id) === req.user!.userId) {
                res.status(400).json({ error: "Cannot change your own role", code: "SELF_ROLE_CHANGE" });
                return;
            }

            const success = userRepo.updateRole(String(req.params.id), role);
            if (!success) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            res.json({ message: "Role updated", userId: String(req.params.id), role });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/admin/users/:id/suspend
 *
 * Suspends a user for a specified duration or indefinitely.
 */
router.post(
    "/users/:id/suspend",
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (String(req.params.id) === req.user!.userId) {
                res.status(400).json({ error: "Cannot suspend yourself", code: "SELF_SUSPEND" });
                return;
            }

            const { until, reason } = req.body;

            const success = userRepo.suspendUser(String(req.params.id), until);
            if (!success) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            // Log the audit event
            analyticsRepo.logAudit({
                userId: req.user!.userId,
                action: "user.suspend",
                resource: "user",
                resourceId: String(req.params.id),
                details: JSON.stringify({ until, reason }),
                ipAddress: req.ip ?? req.socket.remoteAddress,
            });

            // Invalidate all sessions for the suspended user
            sessionRepo.deleteAllForUser(String(req.params.id));

            res.json({ message: "User suspended", userId: String(req.params.id), until: until ?? null });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/admin/users/:id/ban
 *
 * Permanently bans a user (indefinite suspension).
 */
router.post(
    "/users/:id/ban",
    (req: Request, res: Response, next: NextFunction) => {
        try {
            if (String(req.params.id) === req.user!.userId) {
                res.status(400).json({ error: "Cannot ban yourself", code: "SELF_BAN" });
                return;
            }

            const success = userRepo.banUser(String(req.params.id));
            if (!success) {
                res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
                return;
            }

            analyticsRepo.logAudit({
                userId: req.user!.userId,
                action: "user.ban",
                resource: "user",
                resourceId: String(req.params.id),
                details: JSON.stringify({ reason: req.body.reason }),
                ipAddress: req.ip ?? req.socket.remoteAddress,
            });

            sessionRepo.deleteAllForUser(String(req.params.id));

            res.json({ message: "User banned", userId: String(req.params.id) });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/admin/analytics
 *
 * Returns analytics data for chart rendering:
 * user growth, active users, project trends, page views,
 * clone counts, build success rates, cluster load, WebSocket
 * connections, and custom time-range data.
 */
router.get("/analytics", (req: Request, res: Response, next: NextFunction) => {
    try {
        const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
        const snapshot = analyticsRepo.getAdminDashboardSnapshot(days);

        const data = {
            userGrowth: analyticsRepo.getUserGrowth(days).map((point) => ({ label: point.label, value: point.count })),
            activeUsers: analyticsRepo.getActiveUsers(days).map((point) => ({ label: point.label, value: point.count })),
            projectTrends: snapshot.repoCreations.map((point) => ({ label: point.label, value: point.value })),
            pageViews: analyticsRepo.getPageViewStats(days).map((point) => ({ label: point.label, value: point.count })),
            cloneStats: analyticsRepo.getCloneStats(days).map((point) => ({ label: point.label, value: point.total })),
            buildStats: analyticsRepo.getBuildStats(days).map((point) => ({ label: point.label, value: point.count })),
            clusterLoad: analyticsRepo.getClusterLoad(Math.min(days, 30)).map((point) => ({ label: point.label, value: point.total })),
            wsConnections: getActiveConnectionCount(),
            repoPushes: snapshot.pushes.map((point) => ({ label: point.label, value: point.value })),
            prOpens: snapshot.prsOpened.map((point) => ({ label: point.label, value: point.value })),
            issueOpens: snapshot.issuesOpened.map((point) => ({ label: point.label, value: point.value })),
            issueCloses: snapshot.issuesClosed.map((point) => ({ label: point.label, value: point.value })),
            logins: snapshot.logins.map((point) => ({ label: point.label, value: point.value })),
        };

        res.json({
            success: true,
            data,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/admin/announcements
 *
 * Creates a platform-wide announcement stored in the database.
 */
router.post(
    "/announcements",
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, message, content, level } = req.body;
            // Accept both 'message' and 'content' for compatibility
            const announcementContent = content || message;

            if (!title || !announcementContent) {
                res.status(400).json({ error: "Title and message are required", code: "VALIDATION_ERROR" });
                return;
            }

            // Store announcement as an audit log entry for simplicity
            analyticsRepo.logAudit({
                userId: req.user!.userId,
                action: "announcement.create",
                resource: "announcement",
                resourceId: "global",
                details: JSON.stringify({ title, message: announcementContent, level: level ?? "info" }),
                ipAddress: req.ip ?? req.socket.remoteAddress,
            });

            res.status(201).json({ message: "Announcement created", title });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/admin/features
 *
 * Lists all feature flags.
 */
router.get("/features", (req: Request, res: Response, next: NextFunction) => {
    try {
        const flags = featureRepo.listFlags();
        res.json({
            success: true,
            data: flags,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * PATCH /api/admin/features
 *
 * Updates or creates a feature flag.
 */
router.patch(
    "/features",
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, enabled, description } = req.body;

            if (!name) {
                res.status(400).json({ error: "Feature name is required", code: "VALIDATION_ERROR" });
                return;
            }

            const existing = featureRepo.findByName(name);

            if (existing) {
                const updated = featureRepo.updateFlag(existing.id, { enabled, description });
                res.json({
                    success: true,
                    data: updated,
                    timestamp: new Date().toISOString(),
                });
            } else {
                const created = featureRepo.createFlag({ name, enabled: enabled ?? false, description });
                res.status(201).json({
                    success: true,
                    data: created,
                    timestamp: new Date().toISOString(),
                });
            }
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/admin/force-update-clusters
 *
 * Sets all online cluster nodes to "updating" status, triggering
 * a rolling update across the cluster.
 */
router.post(
    "/force-update-clusters",
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const onlineNodes = clusterRepo.getOnlineNodes();
            let updated = 0;

            for (const node of onlineNodes) {
                clusterRepo.updateStatus(node.id, "updating");
                updated++;
            }

            analyticsRepo.logAudit({
                userId: req.user!.userId,
                action: "cluster.force_update",
                resource: "cluster",
                resourceId: "all",
                details: JSON.stringify({ nodesUpdated: updated }),
                ipAddress: req.ip ?? req.socket.remoteAddress,
            });

            res.json({ message: "Force update initiated", nodesUpdated: updated });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
