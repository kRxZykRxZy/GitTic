import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth-guard.js";
import { scheduleJob, getUserLimits, getClusterStats } from "../services/cluster-scheduler.js";
import { 
  scheduleWorkflow, 
  unscheduleWorkflow, 
  getScheduledWorkflows,
  getRepositorySchedules,
  toggleSchedule,
  getSchedulerStats,
  describeCron
} from "../services/cron-scheduler.js";

const router = Router();

/**
 * POST /api/v1/workflows/execute
 * 
 * Execute a workflow on appropriate cluster
 * The cluster will compile and run the workflow
 */
router.post("/execute", requireAuth, async (req: Request, res: Response) => {
  try {
    const { yaml, repositoryId, workflowId, repositoryUrl, branch } = req.body;
    
    if (!yaml || !repositoryId) {
      res.status(400).json({ error: "YAML and repositoryId are required" });
      return;
    }
    
    const user = req.user!;
    const userTier = user.tier || "free";
    const limits = getUserLimits(userTier);
    
    // Schedule for execution (cluster will compile)
    const result = await scheduleJob(
      {
        workflowId: workflowId || `workflow-${Date.now()}`,
        repositoryId,
        userId: user.id,
        yaml, // Send raw YAML to cluster
        repositoryUrl: repositoryUrl || "",
        branch: branch || "main",
        userLimits: {
          cores: limits.maxCores,
          memoryGB: limits.maxMemoryGB,
        },
        env: {},
      },
      userTier
    );
    
    if (!result.success) {
      res.status(400).json({
        error: result.message,
      });
      return;
    }
    
    res.json({
      success: true,
      message: result.message,
      clusterId: result.clusterId,
      workflowId,
    });
  } catch (error: any) {
    res.status(500).json({
      error: "Failed to execute workflow",
      details: error.message,
    });
  }
});

/**
 * GET /api/v1/workflows/template
 * 
 * Get a workflow template to help users get started
 */
router.get("/template", (req: Request, res: Response) => {
  const template = `name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    image: node:18-alpine
    resources:
      cores: 4
      memory: 8GB
    timeout: 1800
    env:
      NODE_ENV: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linter
        run: npm run lint
      
      - name: Run tests
        run: npm test
      
      - name: Build
        run: npm run build`;

  res.json({
    success: true,
    template,
  });
});

/**
 * GET /api/v1/workflows/limits
 * 
 * Get user's workflow resource limits based on tier
 */
router.get("/limits", requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const userTier = user.tier || "free";
  const limits = getUserLimits(userTier);
  
  res.json({
    success: true,
    tier: userTier,
    limits: {
      maxCores: limits.maxCores,
      maxMemoryGB: limits.maxMemoryGB,
      hasGPUAccess: limits.hasGPUAccess,
      canUpgrade: userTier !== "enterprise",
    },
    examples: {
      free: "4 cores, 4GB RAM, No GPU",
      pro: "16 cores, 16GB RAM, GPU",
      team: "32 cores, 32GB RAM, GPU",
      enterprise: "64 cores, 64GB RAM, GPU",
    },
  });
});

/**
 * GET /api/v1/workflows/clusters/stats
 * 
 * Get cluster statistics for monitoring
 */
router.get("/clusters/stats", requireAuth, (req: Request, res: Response) => {
  const stats = getClusterStats();
  
  res.json({
    success: true,
    stats,
  });
});

/**
 * POST /api/v1/workflows/schedule
 * 
 * Schedule a workflow with cron expression
 */
router.post("/schedule", requireAuth, (req: Request, res: Response) => {
  const { repositoryId, workflowPath, yaml } = req.body;
  
  if (!repositoryId || !workflowPath || !yaml) {
    res.status(400).json({
      error: "repositoryId, workflowPath, and yaml are required",
    });
    return;
  }
  
  const result = scheduleWorkflow(repositoryId, workflowPath, yaml);
  
  if (result.scheduled === 0 && result.errors.length > 0) {
    res.status(400).json({
      success: false,
      error: "Failed to schedule workflow",
      details: result.errors,
    });
    return;
  }
  
  res.json({
    success: true,
    scheduled: result.scheduled,
    errors: result.errors,
    message: `Scheduled ${result.scheduled} cron job(s)`,
  });
});

/**
 * DELETE /api/v1/workflows/schedule
 * 
 * Unschedule a workflow
 */
router.delete("/schedule", requireAuth, (req: Request, res: Response) => {
  const { repositoryId, workflowPath, cronExpression } = req.body;
  
  if (!repositoryId || !workflowPath) {
    res.status(400).json({
      error: "repositoryId and workflowPath are required",
    });
    return;
  }
  
  const unscheduled = unscheduleWorkflow(repositoryId, workflowPath, cronExpression);
  
  res.json({
    success: true,
    unscheduled,
    message: `Unscheduled ${unscheduled} cron job(s)`,
  });
});

/**
 * GET /api/v1/workflows/scheduled
 * 
 * Get all scheduled workflows (optionally filtered by repository)
 */
router.get("/scheduled", requireAuth, (req: Request, res: Response) => {
  const { repositoryId } = req.query;
  
  const workflows = getScheduledWorkflows(
    repositoryId ? String(repositoryId) : undefined
  );
  
  res.json({
    success: true,
    count: workflows.length,
    workflows,
  });
});

/**
 * GET /api/v1/workflows/scheduled/:repositoryId
 * 
 * Get scheduled workflows for a specific repository
 */
router.get("/scheduled/:repositoryId", requireAuth, (req: Request, res: Response) => {
  const { repositoryId } = req.params;
  
  const schedules = getRepositorySchedules(Array.isArray(repositoryId) ? repositoryId[0] : repositoryId);
  
  res.json({
    success: true,
    repositoryId,
    count: schedules.length,
    schedules,
  });
});

/**
 * PATCH /api/v1/workflows/schedule/toggle
 * 
 * Enable or disable a scheduled workflow
 */
router.patch("/schedule/toggle", requireAuth, (req: Request, res: Response) => {
  const { repositoryId, workflowPath, cronExpression, enabled } = req.body;
  
  if (!repositoryId || !workflowPath || !cronExpression || enabled === undefined) {
    res.status(400).json({
      error: "repositoryId, workflowPath, cronExpression, and enabled are required",
    });
    return;
  }
  
  const success = toggleSchedule(repositoryId, workflowPath, cronExpression, enabled);
  
  if (!success) {
    res.status(404).json({
      success: false,
      error: "Scheduled workflow not found",
    });
    return;
  }
  
  res.json({
    success: true,
    message: `Workflow ${enabled ? "enabled" : "disabled"}`,
  });
});

/**
 * GET /api/v1/workflows/cron/stats
 * 
 * Get cron scheduler statistics
 */
router.get("/cron/stats", requireAuth, (req: Request, res: Response) => {
  const stats = getSchedulerStats();
  
  res.json({
    success: true,
    stats,
  });
});

/**
 * POST /api/v1/workflows/cron/describe
 * 
 * Get human-readable description of a cron expression
 */
router.post("/cron/describe", (req: Request, res: Response) => {
  const { cronExpression } = req.body;
  
  if (!cronExpression) {
    res.status(400).json({
      error: "cronExpression is required",
    });
    return;
  }
  
  const description = describeCron(cronExpression);
  
  res.json({
    success: true,
    cronExpression,
    description,
  });
});

// In-memory log storage (in production, use database or Redis)
const workflowLogs: Map<string, Array<{ timestamp: string; log: string; level: string }>> = new Map();

/**
 * POST /api/v1/workflows/logs
 * 
 * Receive streamed logs from cluster
 * This endpoint is called by the cluster during workflow execution
 */
router.post("/logs", async (req: Request, res: Response) => {
  try {
    const { workflowId, log, level = "info", timestamp } = req.body;
    
    if (!workflowId || !log) {
      res.status(400).json({ error: "workflowId and log are required" });
      return;
    }
    
    // Store log in memory (or database)
    if (!workflowLogs.has(workflowId)) {
      workflowLogs.set(workflowId, []);
    }
    
    workflowLogs.get(workflowId)!.push({
      timestamp: timestamp || new Date().toISOString(),
      log,
      level,
    });
    
    // Keep only last 10000 lines per workflow to prevent memory issues
    const logs = workflowLogs.get(workflowId)!;
    if (logs.length > 10000) {
      workflowLogs.set(workflowId, logs.slice(-10000));
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/workflows/logs/:workflowId
 * 
 * Get logs for a specific workflow
 */
router.get("/logs/:workflowId", requireAuth, (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const { tail } = req.query; // Optional: get last N lines
  
  const logs = workflowLogs.get(Array.isArray(workflowId) ? workflowId[0] : workflowId) || [];
  
  let filteredLogs = logs;
  if (tail) {
    const tailCount = parseInt(String(tail), 10);
    if (!isNaN(tailCount) && tailCount > 0) {
      filteredLogs = logs.slice(-tailCount);
    }
  }
  
  res.json({
    success: true,
    workflowId,
    count: filteredLogs.length,
    logs: filteredLogs,
  });
});

/**
 * DELETE /api/v1/workflows/logs/:workflowId
 * 
 * Clear logs for a specific workflow
 */
router.delete("/logs/:workflowId", requireAuth, (req: Request, res: Response) => {
  const { workflowId } = req.params;
  const workflowIdStr = Array.isArray(workflowId) ? workflowId[0] : workflowId;
  
  const existed = workflowLogs.has(workflowIdStr);
  workflowLogs.delete(workflowIdStr);
  
  res.json({
    success: true,
    message: existed ? "Logs cleared" : "No logs found",
  });
});

export default router;
