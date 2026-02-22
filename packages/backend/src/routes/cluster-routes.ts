import { Router, type Request, type Response, type NextFunction } from "express";
import { requireAuth, requireRole } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import * as clusterRepo from "../db/repositories/cluster-repo.js";

/**
 * Cluster management routes.
 *
 * Provides node registration, heartbeat updates, listing,
 * draining, and force-update endpoints for the distributed
 * build cluster.
 */
const router = Router();

/**
 * POST /api/clusters/register
 *
 * Registers a new cluster node. The node authenticates via its
 * unique token in the request body.
 */
router.post(
    "/register",
    validate([
        { field: "name", location: "body", required: true, type: "string", min: 1, max: 100 },
        { field: "token", location: "body", required: true, type: "string", min: 1 },
        { field: "url", location: "body", type: "string", min: 1, max: 2048 },
        { field: "version", location: "body", type: "string" },
        { field: "capabilities", location: "body" },
        { field: "maxJobs", location: "body", type: "number" },
    ]),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            // Authenticate via token
            const token = req.body.token;
            if (!token) {
                res.status(401).json({ error: "Cluster token is required", code: "UNAUTHORIZED" });
                return;
            }

            const existing = clusterRepo.findByToken(token);
            if (existing) {
                res.status(409).json({ error: "Node token already registered", code: "CONFLICT" });
                return;
            }

            const capabilities = Array.isArray(req.body.capabilities)
                ? (req.body.capabilities.filter((c: unknown) => typeof c === "string") as string[])
                : [];

            const node = clusterRepo.register({
                name: req.body.name,
                token: token,
                url: typeof req.body.url === "string" && req.body.url.trim().length > 0
                    ? req.body.url.trim()
                    : `http://localhost:4000`,
                version: req.body.version || "1.0.0",
                capabilities,
                maxJobs: req.body.maxJobs || 10,
            });

            res.status(201).json(node);
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/clusters/heartbeat
 *
 * Updates a node's health metrics. The node authenticates via
 * its unique token in the request body.
 */
router.post(
    "/heartbeat",
    validate([
        { field: "token", location: "body", required: true, type: "string" },
        { field: "cpuUsage", location: "body", required: true, type: "number" },
        { field: "memoryUsage", location: "body", required: true, type: "number" },
        { field: "activeJobs", location: "body", required: true, type: "number" },
    ]),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const node = clusterRepo.findByToken(req.body.token);
            if (!node) {
                res.status(401).json({ error: "Invalid node token", code: "AUTH_INVALID_TOKEN" });
                return;
            }

            const updated = clusterRepo.updateHeartbeat(node.id, {
                cpuUsage: req.body.cpuUsage,
                memoryUsage: req.body.memoryUsage,
                activeJobs: req.body.activeJobs,
            });

            if (!updated) {
                res.status(500).json({ error: "Failed to update heartbeat", code: "INTERNAL_ERROR" });
                return;
            }

            res.json({ status: "ok", nodeId: node.id });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/clusters/deregister
 *
 * Deregisters (removes) a cluster node. The node authenticates via
 * its unique token in the request body. Called when the cluster agent
 * shuts down gracefully.
 */
router.post(
    "/deregister",
    validate([
        { field: "token", location: "body", required: true, type: "string" },
    ]),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const node = clusterRepo.findByToken(req.body.token);
            if (!node) {
                res.status(401).json({ error: "Invalid node token", code: "AUTH_INVALID_TOKEN" });
                return;
            }

            clusterRepo.deleteNode(node.id);
            res.json({ message: "Node deregistered successfully", nodeId: node.id });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/clusters
 *
 * Lists all cluster nodes. Admin-only.
 */
router.get(
    "/",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const status = req.query.status as string | undefined;
            const nodes = status
                ? clusterRepo.listNodes(status as "online" | "offline" | "draining" | "updating")
                : clusterRepo.listNodes();

            res.json({
                nodes,
                total: nodes.length,
            });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * GET /api/clusters/discover
 *
 * Returns online nodes available for job scheduling.
 * Used by the scheduler to find available capacity.
 */
router.get("/discover", requireAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const onlineNodes = clusterRepo.getOnlineNodes();
        const available = onlineNodes.filter((n) => n.activeJobs < n.maxJobs);

        res.json({
            data: available.map((n) => ({
                id: n.id,
                name: n.name,
                url: n.url,
                cpuUsage: n.cpuUsage,
                memoryUsage: n.memoryUsage,
                activeJobs: n.activeJobs,
                maxJobs: n.maxJobs,
                capabilities: n.capabilities,
            })),
            total: available.length,
        });
    } catch (err) {
        next(err);
    }
});

/**
 * GET /api/clusters/:id
 *
 * Returns details for a single cluster node.
 */
router.get("/:id", requireAuth, (req: Request, res: Response, next: NextFunction) => {
    try {
        const node = clusterRepo.findById(String(req.params.id));
        if (!node) {
            res.status(404).json({ error: "Cluster node not found", code: "NOT_FOUND" });
            return;
        }

        res.json(node);
    } catch (err) {
        next(err);
    }
});

/**
 * DELETE /api/clusters/:id
 *
 * Removes a cluster node from the registry. Admin-only.
 */
router.delete(
    "/:id",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const node = clusterRepo.findById(String(req.params.id));
            if (!node) {
                res.status(404).json({ error: "Cluster node not found", code: "NOT_FOUND" });
                return;
            }

            clusterRepo.deleteNode(String(req.params.id));
            res.json({ message: "Node removed successfully" });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/clusters/:id/drain
 *
 * Sets a node to "draining" status, preventing new jobs from
 * being scheduled while existing jobs complete.
 */
router.post(
    "/:id/drain",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const node = clusterRepo.findById(String(req.params.id));
            if (!node) {
                res.status(404).json({ error: "Cluster node not found", code: "NOT_FOUND" });
                return;
            }

            if (node.status === "draining") {
                res.status(400).json({ error: "Node is already draining", code: "ALREADY_DRAINING" });
                return;
            }

            clusterRepo.updateStatus(String(req.params.id), "draining");
            res.json({ message: "Node set to draining", nodeId: String(req.params.id) });
        } catch (err) {
            next(err);
        }
    },
);

/**
 * POST /api/clusters/:id/update
 *
 * Sets a node to "updating" status, indicating it is being
 * upgraded and should not receive new work.
 */
router.post(
    "/:id/update",
    requireAuth,
    requireRole("admin"),
    (req: Request, res: Response, next: NextFunction) => {
        try {
            const node = clusterRepo.findById(String(req.params.id));
            if (!node) {
                res.status(404).json({ error: "Cluster node not found", code: "NOT_FOUND" });
                return;
            }

            clusterRepo.updateStatus(String(req.params.id), "updating");
            res.json({ message: "Node set to updating", nodeId: String(req.params.id) });
        } catch (err) {
            next(err);
        }
    },
);

export default router;
