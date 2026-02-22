import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth-guard.js";
import * as announcementsRepo from "../db/repositories/announcements-repo.js";

/**
 * Public and admin announcements routes.
 * Public routes allow any user (including unauthenticated) to fetch active announcements.
 * Admin routes allow creating, updating, and deleting announcements.
 */
const router = Router();

/**
 * GET /api/announcements
 *
 * Fetches all active platform announcements.
 * Public endpoint - accessible to all users.
 */
router.get("/", (req: Request, res: Response, next: NextFunction) => {
    try {
        const announcements = announcementsRepo.getActiveAnnouncements().map((a) => ({
            ...a,
            message: a.body, // Map 'body' to 'message' for frontend compatibility
        }));

        res.json({
            success: true,
            data: {
                announcements,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/announcements/:id
 *
 * Fetches a specific announcement by ID.
 */
router.get("/:id", (req: Request, res: Response, next: NextFunction) => {
    try {
        const announcement = announcementsRepo.getAnnouncementById(String(req.params.id));

        if (!announcement) {
            res.status(404).json({ error: "Announcement not found", code: "NOT_FOUND" });
            return;
        }

        res.json({
            success: true,
            data: {
                ...announcement,
                message: announcement.body,
            },
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
});

/**
 * POST /api/announcements
 *
 * Creates a new announcement.
 * Admin-only endpoint.
 */
router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, message, type, expiresAt } = req.body;

            if (!title || !message) {
                res.status(400).json({
                    error: "title and message are required",
                    code: "VALIDATION_ERROR",
                });
                return;
            }

            const announcement = announcementsRepo.createAnnouncement(
                title,
                message,
                type || "info",
                req.user!.userId,
                expiresAt,
            );

            res.status(201).json({
                success: true,
                data: {
                    ...announcement,
                    message: announcement.body,
                },
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * PATCH /api/announcements/:id
 *
 * Updates an announcement.
 * Admin-only endpoint.
 */
router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const { title, message, type, active, expiresAt } = req.body;

            const updates: Parameters<typeof announcementsRepo.updateAnnouncement>[1] = {};
            if (title !== undefined) updates.title = title;
            if (message !== undefined) updates.body = message;
            if (type !== undefined) updates.type = type;
            if (active !== undefined) updates.active = active;
            if (expiresAt !== undefined) updates.expiresAt = expiresAt;

            const success = announcementsRepo.updateAnnouncement(String(req.params.id), updates);

            if (!success) {
                res.status(404).json({ error: "Announcement not found", code: "NOT_FOUND" });
                return;
            }

            const announcement = announcementsRepo.getAnnouncementById(String(req.params.id));

            res.json({
                success: true,
                data: announcement
                    ? {
                        ...announcement,
                        message: announcement.body,
                    }
                    : null,
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * DELETE /api/announcements/:id
 *
 * Deletes (deactivates) an announcement.
 * Admin-only endpoint.
 */
router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const success = announcementsRepo.deleteAnnouncement(String(req.params.id));

            if (!success) {
                res.status(404).json({ error: "Announcement not found", code: "NOT_FOUND" });
                return;
            }

            res.json({
                success: true,
                message: "Announcement deleted",
                timestamp: new Date().toISOString(),
            });
        } catch (err) {
            next(err);
        }
    },
);

export default router;

