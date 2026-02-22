import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, optionalAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as orgRepo from "../db/repositories/org-repo.js";
import * as userRepo from "../db/repositories/user-repo.js";

/**
 * Organization CRUD routes.
 *
 * Manages creation, listing, updating, and deletion of
 * organizations as well as member management.
 */
const router = Router();

/**
 * Check whether a user has admin-level access to an organization.
 * Returns true if the user is the org owner, an org admin, or a
 * platform admin.
 */
function isOrgAdmin(orgId: string, userId: string, platformRole: string): boolean {
  if (platformRole === "admin") return true;

  const org = orgRepo.findById(orgId);
  if (!org) return false;
  if (org.ownerId === userId) return true;

  const members = orgRepo.listMembers(orgId);
  const member = members.find((m) => m.userId === userId);
  return member?.role === "admin";
}

/**
 * GET /api/orgs
 *
 * Lists organizations. Authenticated users see orgs they belong
 * to; unauthenticated visitors see public orgs only.
 */
router.get("/", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user) {
      const orgs = orgRepo.listByUser(req.user.userId);
      res.json({ data: orgs });
    } else {
      // No public listing for unauthenticated users
      res.json({ data: [] });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orgs
 *
 * Creates a new organization. The authenticated user becomes both
 * the owner and an admin member.
 */
router.post(
  "/",
  requireAuth,
  validate([
    { field: "name", location: "body", required: true, type: "string", min: 2, max: 100 },
    { field: "slug", location: "body", required: true, type: "string", min: 2, max: 100, pattern: /^[a-z0-9_-]+$/ },
    { field: "description", location: "body", type: "string", max: 500 },
    { field: "isPrivate", location: "body", type: "boolean" },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;

      // Check slug uniqueness
      const existing = orgRepo.findBySlug(req.body.slug);
      if (existing) {
        res.status(409).json({ error: "Organization slug already exists", code: "CONFLICT" });
        return;
      }

      const org = orgRepo.createOrg({
        name: req.body.name,
        slug: req.body.slug,
        ownerId: userId,
        description: req.body.description,
        isPrivate: req.body.isPrivate,
        maxRepos: req.body.maxRepos,
        maxMembers: req.body.maxMembers,
      });

      res.status(201).json(org);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/orgs/:id
 *
 * Returns a single organization with its member list.
 */
router.get("/:id", optionalAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = orgRepo.findById(String(req.params.id));
    if (!org) {
      res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
      return;
    }

    // Private orgs require membership or admin
    if (org.isPrivate) {
      if (!req.user) {
        res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
        return;
      }
      const members = orgRepo.listMembers(org.id);
      const isMember = members.some((m) => m.userId === req.user!.userId);
      if (!isMember && req.user.role !== "admin") {
        res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
        return;
      }
    }

    const members = orgRepo.listMembers(org.id);

    // Enrich members with user info
    const enrichedMembers = members.map((m) => {
      const u = userRepo.findById(m.userId);
      return {
        userId: m.userId,
        username: u?.username ?? "unknown",
        role: m.role,
        joinedAt: m.joinedAt,
      };
    });

    res.json({ ...org, members: enrichedMembers });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/orgs/:id
 *
 * Updates organization settings. Only org admins or the owner
 * can perform this operation.
 */
router.patch(
  "/:id",
  requireAuth,
  validate([
    { field: "name", location: "body", type: "string", min: 2, max: 100 },
    { field: "description", location: "body", type: "string", max: 500 },
    { field: "avatarUrl", location: "body", type: "string", max: 2048 },
    { field: "isPrivate", location: "body", type: "boolean" },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = String(req.params.id);

      if (!isOrgAdmin(orgId, req.user!.userId, req.user!.role)) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const updated = orgRepo.updateOrg(orgId, {
        name: req.body.name,
        description: req.body.description,
        avatarUrl: req.body.avatarUrl,
        isPrivate: req.body.isPrivate,
        maxRepos: req.body.maxRepos,
        maxMembers: req.body.maxMembers,
      });

      if (!updated) {
        res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
        return;
      }

      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/orgs/:id
 *
 * Deletes an organization. Only the org owner or a platform admin.
 */
router.delete("/:id", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const org = orgRepo.findById(String(req.params.id));
    if (!org) {
      res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
      return;
    }

    if (org.ownerId !== req.user!.userId && req.user!.role !== "admin") {
      res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
      return;
    }

    orgRepo.deleteOrg(String(req.params.id));
    res.json({ message: "Organization deleted successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/orgs/:id/members
 *
 * Adds a member to the organization.
 * Requires org admin privileges.
 */
router.post(
  "/:id/members",
  requireAuth,
  validate([
    { field: "userId", location: "body", required: true, type: "string" },
    { field: "role", location: "body", type: "string" },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = String(req.params.id);

      if (!isOrgAdmin(orgId, req.user!.userId, req.user!.role)) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const org = orgRepo.findById(orgId);
      if (!org) {
        res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
        return;
      }

      // Check that target user exists
      const targetUser = userRepo.findById(req.body.userId);
      if (!targetUser) {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }

      // Check member limit
      const members = orgRepo.listMembers(orgId);
      if (members.length >= org.maxMembers) {
        res.status(403).json({ error: "Organization member limit reached", code: "MEMBER_LIMIT" });
        return;
      }

      const role = req.body.role ?? "member";
      orgRepo.addMember(orgId, req.body.userId, role);

      res.status(201).json({
        message: "Member added",
        userId: req.body.userId,
        role,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * DELETE /api/orgs/:id/members/:userId
 *
 * Removes a member from the organization.
 * Org admins can remove anyone; members can remove themselves.
 */
router.delete(
  "/:id/members/:userId",
  requireAuth,
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = String(req.params.id);
      const targetUserId = String(req.params.userId);

      // Self-removal is always allowed
      const isSelf = req.user!.userId === targetUserId;
      if (!isSelf && !isOrgAdmin(orgId, req.user!.userId, req.user!.role)) {
        res.status(403).json({ error: "Forbidden", code: "FORBIDDEN" });
        return;
      }

      const org = orgRepo.findById(orgId);
      if (!org) {
        res.status(404).json({ error: "Organization not found", code: "NOT_FOUND" });
        return;
      }

      // Cannot remove the org owner
      if (targetUserId === org.ownerId) {
        res.status(400).json({ error: "Cannot remove the organization owner", code: "OWNER_REMOVE" });
        return;
      }

      const removed = orgRepo.removeMember(orgId, targetUserId);
      if (!removed) {
        res.status(404).json({ error: "Member not found", code: "NOT_FOUND" });
        return;
      }

      res.json({ message: "Member removed" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
