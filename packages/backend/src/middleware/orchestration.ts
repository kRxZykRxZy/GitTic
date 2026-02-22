import type { Request, Response, NextFunction } from "express";
import * as clusterRepo from "../db/repositories/cluster-repo.js";

/**
 * Orchestration Middleware
 * 
 * When FORWARDING_ORCHESTRER=true, this middleware intercepts all requests
 * and forwards them to available cluster nodes instead of handling them locally.
 * 
 * This turns the server into a pure orchestrator that:
 * - Receives requests
 * - Load balances across cluster nodes
 * - Returns responses from clusters
 * - Handles no business logic itself
 */

let currentNodeIndex = 0;

/**
 * Get the next available cluster node using round-robin load balancing
 */
function getNextNode() {
  const nodes = clusterRepo.listNodes();
  const availableNodes = nodes.filter(n => n.status === "online");
  
  if (availableNodes.length === 0) {
    throw new Error("No available cluster nodes");
  }
  
  // Round-robin selection
  const node = availableNodes[currentNodeIndex % availableNodes.length];
  currentNodeIndex = (currentNodeIndex + 1) % availableNodes.length;
  
  return node;
}

/**
 * Forward request to a cluster node
 */
async function forwardRequest(req: Request, targetUrl: string): Promise<globalThis.Response> {
  const url = new URL(req.originalUrl, targetUrl);
  
  // Build headers
  const headers: HeadersInit = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === "string") {
      headers[key] = value;
    } else if (Array.isArray(value)) {
      headers[key] = value.join(", ");
    }
  }
  
  // Add orchestrator header
  headers["X-Forwarded-By"] = "orchestrator";
  headers["X-Forwarded-Host"] = req.get("host") || "";
  
  const options: RequestInit = {
    method: req.method,
    headers,
  };
  
  // Include body for non-GET requests
  if (req.method !== "GET" && req.method !== "HEAD") {
    options.body = JSON.stringify(req.body);
  }
  
  const response = await fetch(url.toString(), options);
  return response;
}

/**
 * Orchestration middleware - forwards all requests to clusters
 */
export function orchestrationMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Check if orchestration mode is enabled
  const isOrchestrator = process.env.FORWARDING_ORCHESTRER === "true";
  
  if (!isOrchestrator) {
    // Not in orchestration mode, proceed normally
    return next();
  }
  
  // Skip health checks and cluster registration endpoints
  // These must be handled locally
  const localPaths = [
    "/api/v1/health",
    "/api/v1/health/ready",
    "/api/v1/health/live",
    "/api/v1/clusters/register",
    "/api/v1/clusters/heartbeat",
  ];
  
  if (localPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  // Forward request to cluster
  (async () => {
    try {
      const node = getNextNode();
      console.log(`[Orchestrator] Forwarding ${req.method} ${req.path} to ${node.name} (${node.url})`);
      
      const clusterResponse = await forwardRequest(req, node.url);
      
      // Copy headers from cluster response
      clusterResponse.headers.forEach((value: string, key: string) => {
        res.setHeader(key, value);
      });
      
      // Add orchestration header
      res.setHeader("X-Served-By", `cluster:${node.name}`);
      
      // Set status and send body
      res.status(clusterResponse.status);
      
      // Stream response body
      const body = await clusterResponse.text();
      res.send(body);
      
    } catch (error) {
      console.error("[Orchestrator] Forwarding failed:", error);
      
      // Try to get another node
      try {
        const fallbackNode = getNextNode();
        console.log(`[Orchestrator] Retrying with ${fallbackNode.name}`);
        
        const clusterResponse = await forwardRequest(req, fallbackNode.url);
        const body = await clusterResponse.text();
        
        res.status(clusterResponse.status);
        res.setHeader("X-Served-By", `cluster:${fallbackNode.name}`);
        res.send(body);
        
      } catch (retryError) {
        console.error("[Orchestrator] Retry failed:", retryError);
        res.status(503).json({
          success: false,
          error: "Service unavailable - all cluster nodes unreachable",
          timestamp: new Date().toISOString(),
        });
      }
    }
  })();
}

/**
 * Get orchestration statistics
 */
export function getOrchestrationStats() {
  const nodes = clusterRepo.listNodes();
  const availableNodes = nodes.filter(n => n.status === "online");
  
  return {
    enabled: process.env.FORWARDING_ORCHESTRER === "true",
    totalNodes: nodes.length,
    availableNodes: availableNodes.length,
    currentNodeIndex,
    nodes: availableNodes.map(n => ({
      name: n.name,
      url: n.url,
      cpuUsage: n.cpuUsage,
      memoryUsage: n.memoryUsage,
      activeJobs: n.activeJobs,
      maxJobs: n.maxJobs,
    })),
  };
}
