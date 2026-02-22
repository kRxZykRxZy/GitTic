import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";

/**
 * Organization routes
 * Handles organization management, members, teams, and permissions
 */
const router = Router();

/**
 * GET /api/orgs/:orgname
 * Get organization details
 */
router.get(
  "/:orgname",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname } = req.params;

      const org = {
        id: "1",
        login: orgname,
        name: orgname,
        description: "Organization description",
        avatarUrl: null,
        email: null,
        location: null,
        createdAt: new Date().toISOString(),
        publicRepos: 0,
        privateRepos: 0,
        totalRepos: 0,
        members: 1
      };

      res.json(org);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/orgs/:orgname/members
 * List organization members
 */
router.get(
  "/:orgname/members",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname } = req.params;
      const { page = "1", perPage = "20", role } = req.query;

      const members: any[] = [];

      res.json({
        items: members,
        total: 0,
        page: parseInt(String(page)),
        perPage: parseInt(String(perPage))
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PUT /api/orgs/:orgname/members/:username
 * Add or update organization member
 */
router.put(
  "/:orgname/members/:username",
  requireAuth,
  validate([
    { field: "role", location: "body", required: true, type: "string",
      pattern: /^(member|admin|owner)$/ }
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname, username } = req.params;
      const { role } = req.body;

      res.status(201).json({
        message: `${username} added to ${orgname} as ${role}`,
        username,
        role
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/orgs/:orgname/members/:username
 * Remove organization member
 */
router.delete(
  "/:orgname/members/:username",
  requireAuth,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname, username } = req.params;

      res.json({
        message: `${username} removed from ${orgname}`
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/orgs/:orgname/teams
 * List organization teams
 */
router.get(
  "/:orgname/teams",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname } = req.params;

      const teams: any[] = [];

      res.json({
        items: teams,
        total: 0
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/orgs/:orgname/teams
 * Create a team
 */
router.post(
  "/:orgname/teams",
  requireAuth,
  validate([
    { field: "name", location: "body", required: true, type: "string", min: 1, max: 255 },
    { field: "description", location: "body", type: "string", max: 500 },
    { field: "privacy", location: "body", type: "string", pattern: /^(secret|closed)$/ },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname } = req.params;
      const { name, description, privacy = "secret" } = req.body;

      const team = {
        id: Date.now().toString(),
        name,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
        description,
        privacy,
        createdAt: new Date().toISOString()
      };

      res.status(201).json(team);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/orgs/:orgname/teams/:teamSlug/members
 * List team members
 */
router.get(
  "/:orgname/teams/:teamSlug/members",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname, teamSlug } = req.params;

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
 * PUT /api/orgs/:orgname/teams/:teamSlug/members/:username
 * Add team member
 */
router.put(
  "/:orgname/teams/:teamSlug/members/:username",
  requireAuth,
  validate([
    { field: "role", location: "body", type: "string", pattern: /^(member|maintainer)$/ }
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname, teamSlug, username } = req.params;
      const { role = "member" } = req.body;

      res.status(201).json({
        message: `${username} added to team ${teamSlug}`,
        role
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/orgs/:orgname/teams/:teamSlug/repos
 * List team repositories
 */
router.get(
  "/:orgname/teams/:teamSlug/repos",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname, teamSlug } = req.params;

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
 * PUT /api/orgs/:orgname/teams/:teamSlug/repos/:owner/:repo
 * Add repository to team
 */
router.put(
  "/:orgname/teams/:teamSlug/repos/:owner/:repo",
  requireAuth,
  validate([
    { field: "permission", location: "body", required: true, type: "string",
      pattern: /^(pull|push|admin|maintain|triage)$/ }
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { orgname, teamSlug, owner, repo } = req.params;
      const { permission } = req.body;

      res.status(201).json({
        message: `Repository ${owner}/${repo} added to team ${teamSlug} with ${permission} permission`
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
