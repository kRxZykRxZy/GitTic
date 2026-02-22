import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as issueRepo from "../db/repositories/issue-repo.js";
import * as commentRepo from "../db/repositories/comment-repo.js";
import * as labelRepo from "../db/repositories/label-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import { getConfig } from "../config/app-config.js";
import * as path from "node:path";

const router = Router();

// GET /:owner/:repo/issues - List issues
router.get("/:owner/:repo/issues", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'open', page = '1', perPage = '20' } = req.query;
    
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
    
    const pageNum = parseInt(String(page));
    const perPageNum = parseInt(String(perPage));
    
    const issues = issueRepo.listByRepository(
      project.id,
      { page: pageNum, perPage: perPageNum },
      state as "open" | "closed" | "all"
    );
    
    const total = issueRepo.countByRepository(
      project.id,
      state as "open" | "closed" | "all"
    );
    
    res.json({
      items: issues,
      total,
      page: pageNum,
      perPage: perPageNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /:owner/:repo/issues/:number - Get issue details
router.get("/:owner/:repo/issues/:number", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    // Get assignees and labels
    const assignees = issueRepo.getAssignees(issue.id);
    const labels = labelRepo.getIssueLabels(issue.id);
    const commentCount = commentRepo.countIssueComments(issue.id);
    
    res.json({
      ...issue,
      assignees,
      labels,
      commentCount,
    });
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/issues - Create issue
router.post("/:owner/:repo/issues", requireAuth,
  validate([
    { field: "title", location: "body", required: true, type: "string", min: 1, max: 255 },
    { field: "body", location: "body", type: "string", max: 65535 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, assignees, labels } = req.body;
    
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
    
    const issue = issueRepo.create({
      repositoryId: project.id,
      title,
      body,
      authorId: req.user!.userId,
      assignees,
      labels,
    });
    
    res.status(201).json(issue);
  } catch (err) {
    next(err);
  }
});

// PATCH /:owner/:repo/issues/:number - Update issue
router.patch("/:owner/:repo/issues/:number", requireAuth,
  validate([
    { field: "title", location: "body", type: "string", min: 1, max: 255 },
    { field: "body", location: "body", type: "string", max: 65535 },
    { field: "state", location: "body", type: "string", pattern: /^(open|closed)$/ },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { title, body, state } = req.body;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    // Check permissions
    const canEdit = req.user!.userId === issue.authorId || req.user!.userId === ownerUser.id || req.user!.role === "admin";
    if (!canEdit) {
      res.status(403).json({ error: "Forbidden: insufficient permissions", code: "FORBIDDEN" });
      return;
    }
    
    const updated = issueRepo.update(issue.id, {
      title,
      body,
      state: state as "open" | "closed" | undefined,
      closedById: state === "closed" ? req.user!.userId : undefined,
    });
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /:owner/:repo/issues/:number/comments - Get issue comments
router.get("/:owner/:repo/issues/:number/comments", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    const comments = commentRepo.listIssueComments(issue.id);
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/issues/:number/comments - Add comment to issue
router.post("/:owner/:repo/issues/:number/comments", requireAuth,
  validate([
    { field: "body", location: "body", required: true, type: "string", min: 1, max: 65535 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { body } = req.body;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    const comment = commentRepo.createIssueComment(
      issue.id,
      req.user!.userId,
      body,
      issue.title
    );
    
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/issues/:number/labels - Add label to issue
router.post("/:owner/:repo/issues/:number/labels", requireAuth,
  validate([
    { field: "label", location: "body", required: true, type: "string", min: 1, max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { label } = req.body;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    labelRepo.addIssueLabel(issue.id, label);
    const labels = labelRepo.getIssueLabels(issue.id);
    
    res.json({ labels });
  } catch (err) {
    next(err);
  }
});

// DELETE /:owner/:repo/issues/:number/labels/:label - Remove label from issue
router.delete("/:owner/:repo/issues/:number/labels/:label", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number, label } = req.params;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    labelRepo.removeIssueLabel(issue.id, String(label));
    const labels = labelRepo.getIssueLabels(issue.id);
    
    res.json({ labels });
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/issues/:number/assignees - Add assignee to issue
router.post("/:owner/:repo/issues/:number/assignees", requireAuth,
  validate([
    { field: "assignee", location: "body", required: true, type: "string" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { assignee } = req.body;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    // Find assignee user
    const assigneeUser = userRepo.findByUsername(String(assignee));
    if (!assigneeUser) {
      res.status(404).json({ error: "Assignee user not found", code: "NOT_FOUND" });
      return;
    }
    
    issueRepo.addAssignee(issue.id, assigneeUser.id);
    const assignees = issueRepo.getAssignees(issue.id);
    
    res.json({ assignees });
  } catch (err) {
    next(err);
  }
});

// DELETE /:owner/:repo/issues/:number/assignees/:username - Remove assignee from issue
router.delete("/:owner/:repo/issues/:number/assignees/:username", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number, username } = req.params;
    
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
    
    const issue = issueRepo.findByNumber(project.id, parseInt(String(number)));
    if (!issue) {
      res.status(404).json({ error: "Issue not found", code: "NOT_FOUND" });
      return;
    }
    
    const assigneeUser = userRepo.findByUsername(String(username));
    if (!assigneeUser) {
      res.status(404).json({ error: "Assignee user not found", code: "NOT_FOUND" });
      return;
    }
    
    issueRepo.removeAssignee(issue.id, assigneeUser.id);
    const assignees = issueRepo.getAssignees(issue.id);
    
    res.json({ assignees });
  } catch (err) {
    next(err);
  }
});

export default router;
