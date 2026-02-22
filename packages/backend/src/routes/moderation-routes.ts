import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as moderationRepo from "../db/repositories/moderation-repo.js";
import * as analyticsRepo from "../db/repositories/analytics-repo.js";

/**
 * Moderation routes.
 *
 * Handles content reporting, report listing and resolution,
 * and a moderation dashboard with aggregate stats.
 */
const router = Router();

/** Default pagination. */
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * Parse and clamp pagination query params.
 */
function parsePagination(query: Record<string, unknown>): { page: number; perPage: number } {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(query.perPage) || DEFAULT_PER_PAGE));
  return { page, perPage };
}

/**
 * POST /api/moderation/reports
 *
 * Submits a new moderation report. Any authenticated user can
 * report content (users, projects, comments, etc.).
 */
router.post(
  "/reports",
  requireAuth,
  validate([
    { field: "targetType", location: "body", required: true, type: "string" },
    { field: "targetId", location: "body", required: true, type: "string" },
    { field: "reason", location: "body", required: true, type: "string", min: 3, max: 1000 },
    { field: "details", location: "body", type: "string", max: 5000 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { targetType, targetId, reason, details } = req.body;

      // Validate target type
      const validTypes = ["user", "project", "comment", "organization"];
      if (!validTypes.includes(targetType)) {
        res.status(400).json({
          error: `Invalid target type. Must be one of: ${validTypes.join(", ")}`,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      // Prevent self-reporting
      if (targetType === "user" && targetId === req.user!.userId) {
        res.status(400).json({ error: "Cannot report yourself", code: "SELF_REPORT" });
        return;
      }

      const report = moderationRepo.createReport({
        reporterId: req.user!.userId,
        targetType,
        targetId,
        reason,
        details,
      });

      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/moderation/reports
 *
 * Lists moderation reports. Moderator+ only.
 * Supports filtering by status and pagination.
 */
router.get(
  "/reports",
  requireAuth,
  requireRole("moderator"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
      const status = req.query.status as string | undefined;

      const validStatuses = ["open", "reviewed", "resolved", "dismissed"];
      if (status && !validStatuses.includes(status)) {
        res.status(400).json({
          error: `Invalid status filter. Must be one of: ${validStatuses.join(", ")}`,
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const reports = moderationRepo.listReports(
        { page, perPage },
        status as "open" | "reviewed" | "resolved" | "dismissed" | undefined,
      );

      res.json({
        data: reports,
        pagination: { page, perPage },
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * PATCH /api/moderation/reports/:id
 *
 * Updates a report's status or resolves it with a note.
 * Moderator+ only.
 */
router.patch(
  "/reports/:id",
  requireAuth,
  requireRole("moderator"),
  validate([
    { field: "status", location: "body", type: "string" },
    { field: "resolution", location: "body", type: "string", max: 2000 },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = String(req.params.id);
      const { status, resolution } = req.body;

      const existing = moderationRepo.findById(reportId);
      if (!existing) {
        res.status(404).json({ error: "Report not found", code: "NOT_FOUND" });
        return;
      }

      // If resolution is provided, resolve the report
      if (resolution) {
        const resolved = moderationRepo.resolve(
          reportId,
          req.user!.userId,
          resolution,
        );

        // Audit log
        analyticsRepo.logAudit({
          userId: req.user!.userId,
          action: "moderation.resolve",
          resource: "moderation_report",
          resourceId: reportId,
          details: JSON.stringify({ resolution }),
          ipAddress: req.ip ?? req.socket.remoteAddress,
        });

        res.json(resolved);
        return;
      }

      // Otherwise just update the status
      if (!status) {
        res.status(400).json({ error: "Status or resolution required", code: "VALIDATION_ERROR" });
        return;
      }

      moderationRepo.updateStatus(reportId, status, req.user!.userId);

      analyticsRepo.logAudit({
        userId: req.user!.userId,
        action: "moderation.status_update",
        resource: "moderation_report",
        resourceId: reportId,
        details: JSON.stringify({ status }),
        ipAddress: req.ip ?? req.socket.remoteAddress,
      });

      const updated = moderationRepo.findById(reportId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/moderation/dashboard
 *
 * Returns aggregate moderation statistics for the dashboard.
 * Moderator+ only.
 */
router.get(
  "/dashboard",
  requireAuth,
  requireRole("moderator"),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const openCount = moderationRepo.getOpenCount();

      // Get recent reports (last 10)
      const recent = moderationRepo.listReports({ page: 1, perPage: 10 });

      // Breakdown by status
      const openReports = moderationRepo.listReports({ page: 1, perPage: 10000 }, "open");
      const resolvedReports = moderationRepo.listReports({ page: 1, perPage: 10000 }, "resolved");

      res.json({
        stats: {
          openCount,
          resolvedCount: resolvedReports.length,
          totalHandled: openReports.length + resolvedReports.length,
        },
        recentReports: recent,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
