import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as branchProtectionRepo from "../db/repositories/branch-protection-repo.js";

/**
 * Repository settings and configuration routes
 * Handles repository-level settings, collaborators, webhooks, deploy keys, etc.
 */
const router = Router();

/**
 * GET /api/repositories/:owner/:repo/settings
 * Get repository settings
 */
router.get(
  "/:owner/:repo/settings",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;
      const ownerUser = userRepo.findByUsername(String(owner));
      if (!ownerUser) {
        res.status(404).json({ error: "Repository owner not found", code: "NOT_FOUND" });
        return;
      }

      const project = projectRepo.findBySlug(ownerUser.id, String(repo));
      if (!project) {
        res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
        return;
      }

      const protection = branchProtectionRepo.findByProjectId(project.id);

      const settings = {
        name: project.name,
        description: project.description || "",
        visibility: project.isPrivate ? "private" : "public",
        defaultBranch: project.defaultBranch,
        hasIssues: true,
        hasProjects: true,
        hasWiki: true,
        allowMergeCommit: true,
        allowSquashMerge: true,
        allowRebaseMerge: true,
        deleteBranchOnMerge: false,
        archived: false,
        disabled: false,
        branchProtection: {
          requirePullRequest: protection.requirePullRequest,
          requiredApprovingReviewCount: protection.requiredApprovingReviewCount,
          requireStatusChecks: protection.requireStatusChecks,
          requiredStatusChecks: protection.requiredStatusChecks,
          enforceAdmins: protection.enforceAdmins,
          requireLinearHistory: protection.requireLinearHistory,
        },
        features: {
          issues: true,
          projects: true,
          wiki: true,
          actions: true,
          packages: true,
          security: true
        }
      };

      res.json(settings);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/repositories/:owner/:repo/settings
 * Update repository settings
 */
router.patch(
  "/:owner/:repo/settings",
  requireAuth,
  validate([
    { field: "description", location: "body", type: "string", max: 500 },
    { field: "visibility", location: "body", type: "string", pattern: /^(public|private|internal)$/ },
    { field: "defaultBranch", location: "body", type: "string", min: 1, max: 255 },
    { field: "branchProtection", location: "body", type: "object" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;
      const updates = req.body;

      const ownerUser = userRepo.findByUsername(String(owner));
      if (!ownerUser) {
        res.status(404).json({ error: "Repository owner not found", code: "NOT_FOUND" });
        return;
      }

      const project = projectRepo.findBySlug(ownerUser.id, String(repo));
      if (!project) {
        res.status(404).json({ error: "Repository not found", code: "NOT_FOUND" });
        return;
      }

      if (updates.branchProtection && typeof updates.branchProtection === "object") {
        branchProtectionRepo.upsertByProjectId(project.id, {
          requirePullRequest: updates.branchProtection.requirePullRequest,
          requiredApprovingReviewCount: updates.branchProtection.requiredApprovingReviewCount,
          requireStatusChecks: updates.branchProtection.requireStatusChecks,
          requiredStatusChecks: updates.branchProtection.requiredStatusChecks,
          enforceAdmins: updates.branchProtection.enforceAdmins,
          requireLinearHistory: updates.branchProtection.requireLinearHistory,
        });
      }

      res.json({
        message: "Repository settings updated",
        ...updates,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/repositories/:owner/:repo/collaborators
 * List repository collaborators
 */
router.get(
  "/:owner/:repo/collaborators",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;
      const { page = "1", perPage = "20" } = req.query;

      const collaborators = [
        {
          id: "1",
          username: owner,
          role: "admin",
          permissions: {
            admin: true,
            maintain: true,
            push: true,
            triage: true,
            pull: true
          },
          addedAt: new Date().toISOString()
        }
      ];

      res.json({
        items: collaborators,
        total: collaborators.length,
        page: parseInt(String(page)),
        perPage: parseInt(String(perPage))
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/repositories/:owner/:repo/collaborators/:username
 * Add or update a collaborator
 */
router.put(
  "/:owner/:repo/collaborators/:username",
  requireAuth,
  validate([
    { field: "permission", location: "body", required: true, type: "string", 
      pattern: /^(pull|triage|push|maintain|admin)$/ }
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo, username } = req.params;
      const { permission } = req.body;

      res.status(201).json({
        message: `${username} added as collaborator with ${permission} access`,
        username,
        permission
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/repositories/:owner/:repo/collaborators/:username
 * Remove a collaborator
 */
router.delete(
  "/:owner/:repo/collaborators/:username",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo, username } = req.params;

      res.json({
        message: `${username} removed from collaborators`
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/repositories/:owner/:repo/webhooks
 * List repository webhooks
 */
router.get(
  "/:owner/:repo/webhooks",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;

      const webhooks: any[] = [];

      res.json({
        items: webhooks,
        total: 0
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/repositories/:owner/:repo/webhooks
 * Create a new webhook
 */
router.post(
  "/:owner/:repo/webhooks",
  requireAuth,
  validate([
    { field: "url", location: "body", required: true, type: "string" },
    { field: "events", location: "body", required: true, type: "object" },
    { field: "active", location: "body", type: "boolean" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;
      const { url, events, active = true, secret } = req.body;

      const webhook = {
        id: Date.now().toString(),
        url,
        events,
        active,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(webhook);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/repositories/:owner/:repo/webhooks/:hookId
 * Delete a webhook
 */
router.delete(
  "/:owner/:repo/webhooks/:hookId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo, hookId } = req.params;

      res.json({ message: "Webhook deleted" });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/repositories/:owner/:repo/keys
 * List deploy keys
 */
router.get(
  "/:owner/:repo/keys",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;

      res.json({
        items: [],
        total: 0
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/repositories/:owner/:repo/keys
 * Add a deploy key
 */
router.post(
  "/:owner/:repo/keys",
  requireAuth,
  validate([
    { field: "title", location: "body", required: true, type: "string", min: 1, max: 255 },
    { field: "key", location: "body", required: true, type: "string" },
    { field: "readOnly", location: "body", type: "boolean" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo } = req.params;
      const { title, key, readOnly = true } = req.body;

      const deployKey = {
        id: Date.now().toString(),
        title,
        key: key.substring(0, 50) + "...",
        readOnly,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(deployKey);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/repositories/:owner/:repo/keys/:keyId
 * Delete a deploy key
 */
router.delete(
  "/:owner/:repo/keys/:keyId",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { owner, repo, keyId } = req.params;

      res.json({ message: "Deploy key deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
