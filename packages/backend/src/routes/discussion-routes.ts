import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as discussionRepo from "../db/repositories/discussion-repo.js";
import * as commentRepo from "../db/repositories/comment-repo.js";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";

const router = Router();

// GET /:owner/:repo/discussions - List discussions
router.get("/:owner/:repo/discussions", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const { category, state = 'open', page = '1', perPage = '20' } = req.query;
    
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
    
    const discussions = discussionRepo.listByRepository(
      project.id,
      { page: pageNum, perPage: perPageNum },
      category as string | undefined,
      state as "open" | "closed" | "all"
    );
    
    const total = discussionRepo.countByRepository(
      project.id,
      category as string | undefined,
      state as "open" | "closed" | "all"
    );
    
    res.json({
      items: discussions,
      total,
      page: pageNum,
      perPage: perPageNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /:owner/:repo/discussions/:number - Get discussion details
router.get("/:owner/:repo/discussions/:number", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
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
    
    const discussion = discussionRepo.findByNumber(project.id, parseInt(String(number)));
    if (!discussion) {
      res.status(404).json({ error: "Discussion not found", code: "NOT_FOUND" });
      return;
    }
    
    res.json(discussion);
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/discussions - Create discussion
router.post("/:owner/:repo/discussions", requireAuth,
  validate([
    { field: "title", location: "body", required: true, type: "string", min: 1, max: 255 },
    { field: "body", location: "body", type: "string", max: 65535 },
    { field: "category", location: "body", type: "string", max: 50 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, category } = req.body;
    
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
    
    const discussion = discussionRepo.create({
      repositoryId: project.id,
      title,
      body,
      category,
      authorId: req.user!.userId,
    });
    
    res.status(201).json(discussion);
  } catch (err) {
    next(err);
  }
});

// PATCH /:owner/:repo/discussions/:number - Update discussion
router.patch("/:owner/:repo/discussions/:number", requireAuth,
  validate([
    { field: "title", location: "body", type: "string", min: 1, max: 255 },
    { field: "body", location: "body", type: "string", max: 65535 },
    { field: "category", location: "body", type: "string", max: 50 },
    { field: "state", location: "body", type: "string", pattern: /^(open|closed)$/ },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { title, body, category, state } = req.body;
    
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
    
    const discussion = discussionRepo.findByNumber(project.id, parseInt(String(number)));
    if (!discussion) {
      res.status(404).json({ error: "Discussion not found", code: "NOT_FOUND" });
      return;
    }
    
    // Check permissions
    const canEdit = req.user!.userId === discussion.authorId || req.user!.userId === ownerUser.id || req.user!.role === "admin";
    if (!canEdit) {
      res.status(403).json({ error: "Forbidden: insufficient permissions", code: "FORBIDDEN" });
      return;
    }
    
    const updated = discussionRepo.update(discussion.id, {
      title,
      body,
      category,
      state: state as "open" | "closed" | undefined,
      closedById: state === "closed" ? req.user!.userId : undefined,
    });
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /:owner/:repo/discussions/:number/comments - Get discussion comments
router.get("/:owner/:repo/discussions/:number/comments", optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
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
    
    const discussion = discussionRepo.findByNumber(project.id, parseInt(String(number)));
    if (!discussion) {
      res.status(404).json({ error: "Discussion not found", code: "NOT_FOUND" });
      return;
    }
    
    // Use the comment repo to fetch discussion comments
    const db = require("../connection.js").getDb();
    const comments = db.prepare("SELECT * FROM discussion_comments WHERE discussion_id = ? ORDER BY created_at ASC").all(discussion.id);
    
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/discussions/:number/comments - Add comment to discussion
router.post("/:owner/:repo/discussions/:number/comments", requireAuth,
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
    
    const discussion = discussionRepo.findByNumber(project.id, parseInt(String(number)));
    if (!discussion) {
      res.status(404).json({ error: "Discussion not found", code: "NOT_FOUND" });
      return;
    }
    
    const { randomUUID } = require("node:crypto");
    const db = require("../connection.js").getDb();
    const id = randomUUID();
    const now = new Date().toISOString();
    
    db.prepare(
      "INSERT INTO discussion_comments (id, discussion_id, author_id, body, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, discussion.id, req.user!.userId, body, now, now);
    
    const comment = db.prepare("SELECT * FROM discussion_comments WHERE id = ?").get(id);
    
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

export default router;
