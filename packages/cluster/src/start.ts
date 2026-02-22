#!/usr/bin/env node
/**
 * Cluster Node - Unified Server
 * Handles registration, heartbeat, and workflow execution
 */

import { ClusterAgent, createClusterConfig } from "./index.js";
import { compileWorkflow } from "./workflow-compiler.js";
import { executeDockerWorkflow } from "./docker-executor.js";
import express from "express";
import dotenv from "dotenv";
import os from "os";

dotenv.config();

const app = express();
app.use(express.json());

const CLUSTER_PORT = parseInt(process.env.CLUSTER_PORT || "4000", 10);
const platformUrl = process.env.PLATFORM_URL || "http://localhost:3000";
const clusterToken = process.env.CLUSTER_TOKEN;
const TOTAL_CORES = parseInt(process.env.TOTAL_CORES || "8", 10);
const TOTAL_MEMORY_GB = parseInt(process.env.TOTAL_MEMORY_GB || "16", 10);
const MAX_JOBS = parseInt(process.env.MAX_JOBS || "5", 10);

let currentStats = {
  cpuUsage: 0,
  memoryUsageGB: 0,
  activeJobs: 0,
};

// HTTP Endpoints for workflow execution
app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "online",
    totalCores: TOTAL_CORES,
    totalMemoryGB: TOTAL_MEMORY_GB,
    availableCores: Math.max(0, TOTAL_CORES - currentStats.cpuUsage),
    availableMemoryGB: Math.max(0, TOTAL_MEMORY_GB - currentStats.memoryUsageGB),
    activeJobs: currentStats.activeJobs,
    maxJobs: MAX_JOBS,
  });
});

app.get("/stats", (req, res) => {
  res.json({
    success: true,
    stats: {
      totalCores: TOTAL_CORES,
      totalMemoryGB: TOTAL_MEMORY_GB,
      cpuUsage: currentStats.cpuUsage,
      memoryUsageGB: currentStats.memoryUsageGB,
      activeJobs: currentStats.activeJobs,
      maxJobs: MAX_JOBS,
    },
  });
});

app.post("/execute", async (req, res) => {
  try {
    const { workflowId, yaml, userLimits, repositoryUrl, branch = "main", env = {} } = req.body;

    if (!workflowId || !yaml || !userLimits) {
      return res.status(400).json({ success: false, error: "Missing required fields" });
    }

    if (currentStats.activeJobs >= MAX_JOBS) {
      return res.status(503).json({ success: false, error: "Cluster at capacity" });
    }

    const compiled = compileWorkflow(yaml, userLimits);
    currentStats.activeJobs++;
    currentStats.cpuUsage += compiled.resources.cores;
    currentStats.memoryUsageGB += compiled.resources.memoryMB / 1024;

    res.json({ success: true, message: "Workflow accepted", workflowId });

    // Execute workflow with server URL for log streaming
    executeDockerWorkflow({ 
      workflowId, 
      compiled, 
      repositoryUrl, 
      branch, 
      env,
      serverUrl: platformUrl // Pass platform URL for log streaming
    })
      .then((result) => console.log(`[Cluster] Workflow ${workflowId} completed: ${result.status}`))
      .catch((error) => console.error(`[Cluster] Workflow ${workflowId} failed:`, error))
      .finally(() => {
        currentStats.activeJobs--;
        currentStats.cpuUsage -= compiled.resources.cores;
        currentStats.memoryUsageGB -= compiled.resources.memoryMB / 1024;
      });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

async function startCluster(): Promise<void> {
    if (!clusterToken) {
        console.error("❌ Error: CLUSTER_TOKEN environment variable is required");
        process.exit(1);
    }

    try {
        // Start HTTP server
        app.listen(CLUSTER_PORT, () => {
          console.log(`\n🚀 Cluster Node Started`);
          console.log(`   Port: ${CLUSTER_PORT}`);
          console.log(`   Cores: ${TOTAL_CORES}`);
          console.log(`   Memory: ${TOTAL_MEMORY_GB}GB`);
          console.log(`   Max Jobs: ${MAX_JOBS}\n`);
        });

        console.log("🔧 Initializing cluster configuration...");

        const config = createClusterConfig({
            serverUrl: platformUrl,
            clusterToken,
        });

        console.log(`📋 Cluster Configuration:`);
        console.log(`   Node ID: ${config.nodeId}`);
        console.log(`   Server URL: ${config.serverUrl}`);

        const agent = new ClusterAgent({
            clusterId: config.nodeId,
            serverUrl: config.serverUrl,
            token: config.clusterToken,
            heartbeatIntervalMs: config.heartbeatIntervalMs,
            capabilities: config.capabilities,
            maxJobs: config.resourceLimits.maxConcurrentJobs,
            version: config.version,
        });

        console.log(`\n🔐 Registering with platform at ${config.serverUrl}...`);
        const registered = await agent.register();

        if (!registered) {
            console.error("❌ Failed to register with platform server.");
            process.exit(1);
        }

        console.log("✅ Successfully registered with platform");
        console.log(`\n💓 Starting heartbeat...`);
        agent.startHeartbeat();
        console.log(`\n🚀 Cluster is ready for workflows\n`);

        const shutdown = async (signal: string) => {
            console.log(`\n${signal} received – shutting down...`);
            agent.stopHeartbeat();
            process.exit(0);
        };

        process.on("SIGTERM", () => shutdown("SIGTERM"));
        process.on("SIGINT", () => shutdown("SIGINT"));
    } catch (error) {
        console.error("❌ Startup failed:", error);
        process.exit(1);
    }
}

startCluster();
