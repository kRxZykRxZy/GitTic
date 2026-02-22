import { api } from "./api-client";
import {
  ApiResponse,
  ClusterNode,
  ClusterNodeStatus,
  Metric,
  PaginatedResponse,
} from "../types/api";

/** Parameters for listing cluster nodes */
export interface ListClustersParams {
  page?: number;
  perPage?: number;
  status?: ClusterNodeStatus;
  region?: string;
  sort?: "hostname" | "cpuUsage" | "ramUsage" | "activeJobs";
  order?: "asc" | "desc";
}

/** Parameters for registering a new cluster node */
export interface RegisterClusterParams {
  hostname: string;
  ipAddress: string;
  maxJobs: number;
  capabilities: string[];
  region: string;
}

/** Cluster statistics summary */
export interface ClusterStats {
  totalNodes: number;
  onlineNodes: number;
  offlineNodes: number;
  drainingNodes: number;
  totalJobs: number;
  activeJobs: number;
  avgCpuUsage: number;
  avgRamUsage: number;
  metrics: Metric[];
}

/** Workflow execution status */
export interface WorkflowExecution {
  id: string;
  workflowName: string;
  status: "pending" | "running" | "success" | "failed" | "cancelled";
  nodeId: string;
  nodeName: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  resources: {
    cores: number;
    memoryGB: number;
  };
  logs: string[];
  artifacts?: string[];
  error?: string;
}

/** User resource limits and tier */
export interface UserLimits {
  tier: "free" | "pro" | "enterprise";
  maxConcurrentWorkflows: number;
  maxCoresPerWorkflow: number;
  maxMemoryPerWorkflow: number;
  maxStoragePerWorkflow: number;
}

/** Workflow execution request */
export interface WorkflowRequest {
  name: string;
  yaml: string;
  branch?: string;
  commit?: string;
  environment?: Record<string, string>;
}

/** Workflow validation result */
export interface WorkflowValidation {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * List all cluster nodes with optional filters.
 */
export async function listClusters(
  params?: ListClustersParams,
): Promise<ApiResponse<PaginatedResponse<ClusterNode>>> {
  return api.get<PaginatedResponse<ClusterNode>>("/clusters", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * Register a new cluster node.
 */
export async function registerCluster(
  data: RegisterClusterParams,
): Promise<ApiResponse<ClusterNode>> {
  return api.post<ClusterNode>("/clusters", data);
}

/**
 * Get a cluster node by ID.
 */
export async function getClusterById(
  id: string,
): Promise<ApiResponse<ClusterNode>> {
  return api.get<ClusterNode>(`/clusters/${encodeURIComponent(id)}`);
}

/**
 * Drain a cluster node (stop accepting new jobs, finish existing ones).
 */
export async function drainCluster(
  id: string,
): Promise<ApiResponse<ClusterNode>> {
  return api.post<ClusterNode>(
    `/clusters/${encodeURIComponent(id)}/drain`,
  );
}

/**
 * Remove a cluster node.
 */
export async function removeCluster(
  id: string,
): Promise<ApiResponse<void>> {
  return api.delete<void>(`/clusters/${encodeURIComponent(id)}`);
}

/**
 * Get aggregate cluster statistics.
 */
export async function getClusterStats(): Promise<
  ApiResponse<ClusterStats>
> {
  return api.get<ClusterStats>("/clusters/stats");
}

/**
 * Get user's resource limits and tier information
 */
export async function getUserLimits(): Promise<ApiResponse<UserLimits>> {
  return api.get<UserLimits>("/user/limits");
}

/**
 * Execute a workflow on the cluster
 */
export async function executeWorkflow(request: WorkflowRequest): Promise<ApiResponse<WorkflowExecution>> {
  return api.post<WorkflowExecution>("/workflows/execute", request);
}

/**
 * Get workflow execution status
 */
export async function getWorkflowExecution(executionId: string): Promise<ApiResponse<WorkflowExecution>> {
  return api.get<WorkflowExecution>(`/workflows/${executionId}`);
}

/**
 * Get all workflow executions for the current user
 */
export async function getWorkflowExecutions(filters?: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<ApiResponse<WorkflowExecution[]>> {
  return api.get<WorkflowExecution[]>("/workflows", { params: filters });
}

/**
 * Cancel a running workflow execution
 */
export async function cancelWorkflowExecution(executionId: string): Promise<ApiResponse<void>> {
  return api.post<void>(`/workflows/${executionId}/cancel`);
}

/**
 * Get real-time logs for a workflow execution
 */
export async function getWorkflowLogs(executionId: string): Promise<ApiResponse<string[]>> {
  return api.get<string[]>(`/workflows/${executionId}/logs`);
}

/**
 * Download workflow artifacts
 */
export async function downloadArtifact(executionId: string, artifactName: string): Promise<Blob> {
  const response = await api.getBlob(`/workflows/${executionId}/artifacts/${artifactName}`);
  return response;
}

/**
 * Validate workflow YAML before execution
 */
export async function validateWorkflow(yaml: string): Promise<ApiResponse<WorkflowValidation>> {
  return api.post<WorkflowValidation>("/workflows/validate", { yaml });
}

/**
 * Get workflow execution metrics and performance data
 */
export async function getWorkflowMetrics(executionId: string): Promise<ApiResponse<{
  cpuUsage: number[];
  memoryUsage: number[];
  networkIO: number[];
  diskIO: number[];
  timestamps: string[];
}>> {
  return api.get(`/workflows/${executionId}/metrics`);
}

/**
 * Test connection to cluster API
 */
export async function testConnection(): Promise<ApiResponse<{ status: "connected" | "error"; message?: string }>> {
  return api.get("/health");
}

/** Cluster service namespace */
export const clusterService = {
  list: listClusters,
  register: registerCluster,
  getById: getClusterById,
  drain: drainCluster,
  remove: removeCluster,
  getStats: getClusterStats,
  // Workflow methods
  getUserLimits,
  executeWorkflow,
  getWorkflowExecution,
  getWorkflowExecutions,
  cancelWorkflowExecution,
  getWorkflowLogs,
  downloadArtifact,
  validateWorkflow,
  getWorkflowMetrics,
  testConnection,
} as const;
