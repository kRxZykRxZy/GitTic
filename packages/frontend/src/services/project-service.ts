import { api } from "./api-client";
import {
  ApiResponse,
  PaginatedResponse,
  Project,
  ProjectStats,
  ProjectVisibility,
} from "../types/api";

/** Parameters for listing projects */
export interface ListProjectsParams {
  page?: number;
  perPage?: number;
  sort?: "name" | "stars" | "updated" | "created";
  order?: "asc" | "desc";
  search?: string;
  visibility?: ProjectVisibility;
  language?: string;
}

/** Parameters for creating a project */
export interface CreateProjectParams {
  name: string;
  description: string;
  visibility: ProjectVisibility;
  initReadme: boolean;
  language?: string;
}

/** Parameters for updating a project */
export interface UpdateProjectParams {
  name?: string;
  description?: string;
  visibility?: ProjectVisibility;
  defaultBranch?: string;
}

/**
 * List projects with optional filters and pagination.
 */
export async function listProjects(
  params?: ListProjectsParams,
): Promise<ApiResponse<PaginatedResponse<Project>>> {
  return api.get<PaginatedResponse<Project>>("/projects", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * Create a new project.
 */
export async function createProject(
  data: CreateProjectParams,
): Promise<ApiResponse<Project>> {
  return api.post<Project>("/projects", data);
}

/**
 * Get a project by its ID.
 */
export async function getProjectById(
  id: string,
): Promise<ApiResponse<Project>> {
  return api.get<Project>(`/projects/${encodeURIComponent(id)}`);
}

/**
 * Update an existing project.
 */
export async function updateProject(
  id: string,
  data: UpdateProjectParams,
): Promise<ApiResponse<Project>> {
  return api.patch<Project>(
    `/projects/${encodeURIComponent(id)}`,
    data,
  );
}

/**
 * Delete a project by its ID.
 */
export async function deleteProject(
  id: string,
): Promise<ApiResponse<void>> {
  return api.delete<void>(`/projects/${encodeURIComponent(id)}`);
}

/**
 * Fork a project.
 */
export async function forkProject(
  id: string,
): Promise<ApiResponse<Project>> {
  return api.post<Project>(
    `/projects/${encodeURIComponent(id)}/fork`,
  );
}

/**
 * Get statistics for a specific project.
 */
export async function getProjectStats(
  id: string,
): Promise<ApiResponse<ProjectStats>> {
  return api.get<ProjectStats>(
    `/projects/${encodeURIComponent(id)}/stats`,
  );
}

/** Project service namespace */
export const projectService = {
  list: listProjects,
  create: createProject,
  getById: getProjectById,
  update: updateProject,
  delete: deleteProject,
  fork: forkProject,
  getStats: getProjectStats,
} as const;
