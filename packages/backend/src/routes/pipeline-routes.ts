import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as pipelineRepo from "../db/repositories/pipeline-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";

/**
 * CI/CD Pipeline routes.
 *
 * Manages pipeline runs for projects: triggering new runs,
 * listing runs, viewing run details, cancelling, and
 * retrieving build logs.
 */
const router = Router();

/** Default pagination. */
const DEFAULT_PAGE = 1;
const DEFAULT_PER_PAGE = 20;
const MAX_PER_PAGE = 100;

/**
 * Parse and clamp pagination query parameters.
 */
function parsePagination(query: Record<string, unknown>): { page: number; perPage: number } {
  const page = Math.max(1, Number(query.page) || DEFAULT_PAGE);
  const perPage = Math.min(MAX_PER_PAGE, Math.max(1, Number(query.perPage) || DEFAULT_PER_PAGE));
  return { page, perPage };
}

/**
 * POST /api/projects/:projectId/pipelines/run
 *
 * Triggers a new pipeline run for the specified project.
 * Only the project owner or a platform admin can trigger runs.
 */
router.post(
  "/projects/:projectId/pipelines/run",
  requireAuth,
  validate([
    { field: "branch", location: "body", required: true, type: "string", min: 1, max: 255 },
    { field: "commitSha", location: "body", required: true, type: "string", min: 7, max: 40 },
    { field: "configHash", location: "body", type: "string" },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = String(req.params.projectId);

      // Verify project exists and user has access
      const project = projectRepo.findById(projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
        return;
      }

      if (project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const run = pipelineRepo.createRun({
        projectId,
        branch: req.body.branch,
        commitSha: req.body.commitSha,
        configHash: req.body.configHash ?? "",
        triggeredBy: req.user!.userId,
      });

      res.status(201).json(run);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/projects/:projectId/pipelines
 *
 * Lists all pipeline runs for a project, most recent first.
 */
router.get(
  "/projects/:projectId/pipelines",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = String(req.params.projectId);

      const project = projectRepo.findById(projectId);
      if (!project) {
        res.status(404).json({ error: "Project not found", code: "NOT_FOUND" });
        return;
      }

      // Private projects require owner or admin
      if (project.isPrivate && project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const { page, perPage } = parsePagination(req.query as Record<string, unknown>);
      const runs = pipelineRepo.getRunsByProject(projectId, { page, perPage });

      res.json({ data: runs, pagination: { page, perPage } });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/pipelines/:id
 *
 * Returns the full details (including stages) for a single
 * pipeline run.
 */
router.get(
  "/pipelines/:id",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = pipelineRepo.findRunById(String(req.params.id));
      if (!run) {
        res.status(404).json({ error: "Pipeline run not found", code: "NOT_FOUND" });
        return;
      }

      // Verify access via the parent project
      const project = projectRepo.findById(run.projectId);
      if (project?.isPrivate && project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      res.json(run);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/pipelines/:id/cancel
 *
 * Cancels a running or queued pipeline run.
 * Only the user who triggered it or an admin can cancel.
 */
router.post(
  "/pipelines/:id/cancel",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = pipelineRepo.findRunById(String(req.params.id));
      if (!run) {
        res.status(404).json({ error: "Pipeline run not found", code: "NOT_FOUND" });
        return;
      }

      // Only triggerer or admin
      if (run.triggeredBy !== req.user!.userId && req.user!.role !== "admin") {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      // Can only cancel non-terminal runs
      if (run.status === "success" || run.status === "failed") {
        res.status(400).json({
          error: `Cannot cancel a run with status '${run.status}'`,
          code: "INVALID_STATE",
        });
        return;
      }

      pipelineRepo.updateRunStatus(String(req.params.id), "failed", {
        finishedAt: new Date().toISOString(),
      });

      res.json({ message: "Pipeline run cancelled", runId: String(req.params.id) });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/pipelines/:id/logs
 *
 * Returns log URLs for each stage of a pipeline run.
 * Actual log content is stored externally; this endpoint
 * provides the metadata and URLs.
 */
router.get(
  "/pipelines/:id/logs",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const run = pipelineRepo.findRunById(String(req.params.id));
      if (!run) {
        res.status(404).json({ error: "Pipeline run not found", code: "NOT_FOUND" });
        return;
      }

      // Verify access via project
      const project = projectRepo.findById(run.projectId);
      if (project?.isPrivate && project.ownerId !== req.user!.userId && req.user!.role !== "admin") {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const stages = run.stages.map((stage) => ({
        stageId: stage.id,
        stageName: stage.stageName,
        status: stage.status,
        logUrl: stage.logUrl ?? null,
        startedAt: stage.startedAt ?? null,
        finishedAt: stage.finishedAt ?? null,
      }));

      res.json({
        runId: run.id,
        status: run.status,
        stages,
      });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
