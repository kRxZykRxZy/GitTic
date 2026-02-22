import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as git from "@platform/git";
import * as projectRepo from "../db/repositories/project-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as prRepo from "../db/repositories/pr-repo.js";
import * as commentRepo from "../db/repositories/comment-repo.js";
import * as labelRepo from "../db/repositories/label-repo.js";
import { getConfig } from "../config/app-config.js";
import * as path from "node:path";

const router = Router();

// GET /api/repositories/:owner/:repo/pulls - List pull requests
router.get("/:owner/:repo/pulls", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const { state = 'open', page = '1', perPage = '20' } = req.query;
    
    // Get repository info
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
    
    const prs = prRepo.listByProject(
      project.id,
      { page: pageNum, perPage: perPageNum },
      state as "open" | "closed" | "merged" | "all"
    );
    
    const total = prRepo.countByProject(
      project.id,
      state as "open" | "closed" | "merged" | "all"
    );
    
    res.json({
      items: prs,
      total,
      page: pageNum,
      perPage: perPageNum,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/repositories/:owner/:repo/pulls/:number - Get PR details
router.get("/:owner/:repo/pulls/:number", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    
    // Get repository info
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
    
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    res.json(pr);
  } catch (err) {
    next(err);
  }
});

// POST /api/repositories/:owner/:repo/pulls - Create PR
router.post("/:owner/:repo/pulls", requireAuth, 
  validate([
    { field: "title", location: "body", required: true, type: "string", min: 1, max: 255 },
    { field: "body", location: "body", type: "string", max: 5000 },
    { field: "head", location: "body", required: true, type: "string", min: 1 },
    { field: "base", location: "body", required: true, type: "string", min: 1 },
    { field: "draft", location: "body", type: "boolean" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo } = req.params;
    const { title, body, head, base, draft = false } = req.body;
    
    // Get repository info
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
    
    // Check if PR already exists with same branches
    const existing = prRepo.findExisting(project.id, base, head);
    if (existing) {
      res.status(409).json({ 
        error: "A pull request already exists for these branches", 
        code: "PR_EXISTS",
        existingPr: existing.number,
      });
      return;
    }
    
    // Create the PR
    const pr = prRepo.create({
      repositoryId: project.id,
      title,
      description: body,
      baseBranch: base,
      headBranch: head,
      authorId: req.user!.userId,
      isDraft: draft,
    });
    
    res.status(201).json(pr);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/repositories/:owner/:repo/pulls/:number - Update PR
router.patch("/:owner/:repo/pulls/:number", requireAuth, 
  validate([
    { field: "title", location: "body", type: "string", min: 1, max: 255 },
    { field: "body", location: "body", type: "string", max: 5000 },
    { field: "state", location: "body", type: "string", pattern: /^(open|closed)$/ },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { title, body, state } = req.body;
    
    // Get repository info
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
    
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    // Check permissions
    const canEdit = req.user!.userId === pr.authorId || req.user!.userId === ownerUser.id || req.user!.role === "admin";
    if (!canEdit) {
      res.status(403).json({ error: "Forbidden: insufficient permissions", code: "FORBIDDEN" });
      return;
    }
    
    // Update the PR
    const updated = prRepo.update(pr.id, {
      title: title !== undefined ? title : undefined,
      description: body !== undefined ? body : undefined,
      state: state as "open" | "closed" | undefined,
    });
    
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// GET /api/repositories/:owner/:repo/pulls/:number/merge-status - Check if PR can be merged
router.get("/:owner/:repo/pulls/:number/merge-status", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    
    // Get repository info
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
    
    // Get PR from database
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    // Check if PR is already merged or closed
    if (pr.state === "merged") {
      res.json({
        mergeable: false,
        canMerge: false,
        canFastForward: false,
        conflicts: [],
        conflictCount: 0,
        checks: [],
        checksStatus: "success",
        reviewsApproved: true,
        requiresReview: false,
        reason: "Pull request is already merged",
        message: "Pull request is already merged",
      });
      return;
    }
    
    if (pr.state === "closed") {
      res.json({
        mergeable: false,
        canMerge: false,
        canFastForward: false,
        conflicts: [],
        conflictCount: 0,
        checks: [],
        checksStatus: "success",
        reviewsApproved: true,
        requiresReview: false,
        reason: "Pull request is closed",
        message: "Pull request is closed",
      });
      return;
    }
    
    // Get actual base and head branches from PR
    const baseBranch = pr.baseBranch;
    const headBranch = pr.headBranch;
    
    // Get repository path
    const config = getConfig();
    const repoPath = path.join(config.repoStoragePath || "/tmp/repos", ownerUser.id, project.slug);
    
    try {
      // Use git package to check mergeability
      const mergeCheck = await git.checkMergeability(repoPath, baseBranch, headBranch);
      const canFastForward = await git.canFastForward(repoPath, headBranch, baseBranch);
      
      // TODO: Get these from actual PR/CI data
      const checksStatus = "success"; // TODO: check CI/CD status from actions
      const reviewsApproved = true; // TODO: check review approvals from reviews table
      const requiresReview = false; // TODO: check branch protection rules
      
      const canMerge = mergeCheck.mergeable && checksStatus === "success" && (reviewsApproved || !requiresReview);
      
      res.json({
        mergeable: mergeCheck.mergeable,
        canMerge,
        canFastForward,
        conflicts: mergeCheck.conflictFiles,
        conflictCount: mergeCheck.conflictFiles.length,
        checks: mergeCheck.checks,
        checksStatus,
        reviewsApproved,
        requiresReview,
        reason: mergeCheck.reason,
        baseBranch,
        headBranch,
        message: !canMerge 
          ? mergeCheck.conflictFiles.length > 0
            ? `Pull request has ${mergeCheck.conflictFiles.length} merge conflict(s)` 
            : !reviewsApproved 
              ? "Pull request requires approval" 
              : checksStatus !== "success"
                ? "Checks must pass before merging"
                : mergeCheck.reason
          : canFastForward
            ? "Pull request can be fast-forward merged"
            : "Pull request can be merged",
      });
    } catch (error) {
      console.error("Error checking merge status:", error);
      res.status(500).json({
        error: "Failed to check merge status",
        code: "MERGE_CHECK_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/repositories/:owner/:repo/pulls/:number/merge - Merge PR
router.post("/:owner/:repo/pulls/:number/merge", requireAuth, 
  validate([
    { field: "merge_method", location: "body", type: "string", pattern: /^(merge|squash|rebase)$/ },
    { field: "commit_title", location: "body", type: "string", max: 255 },
    { field: "commit_message", location: "body", type: "string", max: 5000 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    const { merge_method = "merge", commit_title, commit_message, auto_close = true } = req.body;
    
    // Get repository info
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
    
    // Get PR from database
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    // Check if PR is already merged
    if (pr.state === "merged") {
      res.status(409).json({ 
        error: "Pull request is already merged", 
        code: "ALREADY_MERGED",
        mergeCommitSha: pr.mergeCommitSha,
      });
      return;
    }
    
    // Check if PR is closed
    if (pr.state === "closed") {
      res.status(409).json({ 
        error: "Cannot merge a closed pull request", 
        code: "PR_CLOSED",
      });
      return;
    }
    
    // Check permissions
    const canMerge = req.user!.userId === ownerUser.id || req.user!.role === "admin";
    if (!canMerge) {
      res.status(403).json({ error: "Forbidden: insufficient permissions to merge", code: "FORBIDDEN" });
      return;
    }
    
    // Get actual base and head branches from PR
    const baseBranch = pr.baseBranch;
    const headBranch = pr.headBranch;
    
    // Get repository path
    const config = getConfig();
    const repoPath = path.join(config.repoStoragePath || "/tmp/repos", ownerUser.id, project.slug);
    
    // Check for merge conflicts first
    let mergeCheck: git.MergeCheckResult;
    try {
      mergeCheck = await git.checkMergeability(repoPath, baseBranch, headBranch);
    } catch (error) {
      res.status(500).json({ 
        error: "Failed to check merge status", 
        code: "MERGE_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    
    if (!mergeCheck.mergeable || mergeCheck.conflictFiles.length > 0) {
      res.status(409).json({ 
        error: "Pull request cannot be merged due to conflicts", 
        code: "MERGE_CONFLICT",
        mergeable: mergeCheck.mergeable,
        conflicts: mergeCheck.conflictFiles,
        conflictCount: mergeCheck.conflictFiles.length,
        checks: mergeCheck.checks,
        reason: mergeCheck.reason,
      });
      return;
    }
    
    // Perform the actual merge using git package
    let mergeResult: git.MergeResult;
    try {
      const strategy: git.MergeStrategy = merge_method === "squash" ? "ort" : "ort"; // Map merge methods to strategies
      mergeResult = await git.merge(repoPath, headBranch, baseBranch, strategy);
    } catch (error) {
      res.status(500).json({
        error: "Failed to perform merge",
        code: "MERGE_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
      return;
    }
    
    if (!mergeResult.success) {
      res.status(409).json({
        error: "Merge failed",
        code: "MERGE_FAILED",
        message: mergeResult.message,
        conflicts: mergeResult.conflicts,
      });
      return;
    }
    
    // Update PR status to merged in database
    const mergeCommitSha = mergeResult.sha || "abc123def456";
    prRepo.markAsMerged(pr.id, mergeCommitSha);
    
    // TODO: In a real implementation:
    // 1. Create merge commit with custom title/message if provided
    // 2. Optionally close the PR and delete the head branch
    // 3. Trigger post-merge hooks and notifications
    
    res.json({ 
      merged: true, 
      message: "Pull request successfully merged",
      sha: mergeCommitSha,
      merge_method,
      auto_close,
      conflicts: [],
      base: baseBranch,
      head: headBranch,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/repositories/:owner/:repo/pulls/:number/conflicts - Get merge conflict details
router.get("/:owner/:repo/pulls/:number/conflicts", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { owner, repo, number } = req.params;
    
    // Get repository info
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
    
    // Get PR from database
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    // Get actual base and head branches from PR
    const baseBranch = pr.baseBranch;
    const headBranch = pr.headBranch;
    
    // Get repository path
    const config = getConfig();
    const repoPath = path.join(config.repoStoragePath || "/tmp/repos", ownerUser.id, project.slug);
    
    try {
      // Use git package to get conflict files
      const conflictFilesList = await git.conflictFiles(repoPath, baseBranch, headBranch);
      
      // Get detailed conflict information if merge is in progress
      let detailedConflicts: git.ConflictInfo[] = [];
      const isInProgress = await git.isMergeInProgress(repoPath);
      if (isInProgress) {
        detailedConflicts = await git.getMergeConflicts(repoPath);
      }
      
      res.json({
        hasConflicts: conflictFilesList.length > 0,
        conflictCount: conflictFilesList.length,
        conflictFiles: conflictFilesList,
        conflicts: detailedConflicts.length > 0 ? detailedConflicts : undefined,
        base: baseBranch,
        head: headBranch,
        mergeInProgress: isInProgress,
      });
    } catch (error) {
      console.error("Error getting conflict details:", error);
      res.status(500).json({
        error: "Failed to retrieve conflict information",
        code: "CONFLICT_CHECK_ERROR",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  } catch (err) {
    next(err);
  }
});

// GET /api/repositories/:owner/:repo/pulls/:number/files - Get PR files
router.get("/:owner/:repo/pulls/:number/files", async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ files: [] });
  } catch (err) {
    next(err);
  }
});

// GET /:owner/:repo/pulls/:number/comments - Get PR comments
router.get("/:owner/:repo/pulls/:number/comments", async (req: Request, res: Response, next: NextFunction) => {
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
    
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    const comments = commentRepo.listPRComments(pr.id);
    res.json(comments);
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/pulls/:number/comments - Add comment to PR
router.post("/:owner/:repo/pulls/:number/comments", requireAuth,
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
    
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    const comment = commentRepo.createPRComment(
      pr.id,
      req.user!.userId,
      body,
      pr.title
    );
    
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/pulls/:number/labels - Add label to PR
router.post("/:owner/:repo/pulls/:number/labels", requireAuth,
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
    
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    labelRepo.addPRLabel(pr.id, label);
    const labels = labelRepo.getPRLabels(pr.id);
    
    res.json({ labels });
  } catch (err) {
    next(err);
  }
});

// POST /:owner/:repo/pulls/:number/assignees - Add assignee to PR
router.post("/:owner/:repo/pulls/:number/assignees", requireAuth,
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
    
    const pr = prRepo.findByNumber(project.id, parseInt(String(number)));
    if (!pr) {
      res.status(404).json({ error: "Pull request not found", code: "NOT_FOUND" });
      return;
    }
    
    const assigneeUser = userRepo.findByUsername(assignee);
    if (!assigneeUser) {
      res.status(404).json({ error: "Assignee user not found", code: "NOT_FOUND" });
      return;
    }
    
    prRepo.addAssignee(pr.id, assigneeUser.id);
    
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// POST /api/repositories/:owner/:repo/pulls/:number/reviews - Add review
router.post("/:owner/:repo/pulls/:number/reviews", requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { number } = req.params;
    const { state, body } = req.body;
    res.status(201).json({ id: "1", state, body });
  } catch (err) {
    next(err);
  }
});

export default router;
