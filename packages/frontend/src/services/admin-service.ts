import { api } from "./api-client";
import {
  Announcement,
  AnnouncementType,
  ApiResponse,
  DashboardStats,
  FeatureFlag,
  Metric,
  PaginatedResponse,
  User,
  UserRole,
} from "../types/api";

/** Parameters for listing users */
export interface ListUsersParams {
  page?: number;
  perPage?: number;
  search?: string;
  role?: UserRole;
  sort?: "username" | "created" | "lastLogin";
  order?: "asc" | "desc";
}

/** Analytics time range */
export type TimeRange = "7d" | "30d" | "90d" | "custom";

/** Analytics query params */
export interface AnalyticsParams {
  range: TimeRange;
  startDate?: string;
  endDate?: string;
}

/** Create announcement params */
export interface CreateAnnouncementParams {
  title: string;
  message: string;
  type: AnnouncementType;
  expiresAt?: string;
}

/**
 * Fetch the admin dashboard summary data.
 */
export async function getDashboard(): Promise<ApiResponse<DashboardStats>> {
  return api.get<DashboardStats>("/admin/dashboard");
}

/**
 * Fetch analytics metrics for a given time range.
 */
export async function getAnalytics(
  params: AnalyticsParams,
): Promise<ApiResponse<Metric[]>> {
  return api.get<Metric[]>("/admin/analytics", {
    params: params as unknown as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * List all users with optional filters.
 */
export async function getUsers(
  params?: ListUsersParams,
): Promise<ApiResponse<PaginatedResponse<User>>> {
  return api.get<PaginatedResponse<User>>("/admin/users", {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/**
 * Update a user's role.
 */
export async function updateUserRole(
  userId: string,
  role: UserRole,
): Promise<ApiResponse<User>> {
  return api.patch<User>(`/admin/users/${encodeURIComponent(userId)}/role`, {
    role,
  });
}

/**
 * Suspend a user account.
 */
export async function suspendUser(
  userId: string,
  reason: string,
): Promise<ApiResponse<User>> {
  return api.post<User>(
    `/admin/users/${encodeURIComponent(userId)}/suspend`,
    { reason },
  );
}

/**
 * Ban a user account permanently.
 */
export async function banUser(
  userId: string,
  reason: string,
): Promise<ApiResponse<User>> {
  return api.post<User>(
    `/admin/users/${encodeURIComponent(userId)}/ban`,
    { reason },
  );
}

/**
 * Fetch all feature flags.
 */
export async function getFeatureFlags(): Promise<
  ApiResponse<FeatureFlag[]>
> {
  return api.get<FeatureFlag[]>("/admin/features");
}

/**
 * Toggle a feature flag on or off.
 */
export async function toggleFeature(
  flagId: string,
  enabled: boolean,
): Promise<ApiResponse<FeatureFlag>> {
  return api.patch<FeatureFlag>(
    `/admin/features/${encodeURIComponent(flagId)}`,
    { enabled },
  );
}

/**
 * Create a new global announcement.
 */
export async function createAnnouncement(
  data: CreateAnnouncementParams,
): Promise<ApiResponse<Announcement>> {
  return api.post<Announcement>("/admin/announcements", data);
}

/** Admin service namespace */
export const adminService = {
  getDashboard,
  getAnalytics,
  getUsers,
  updateUserRole,
  suspendUser,
  banUser,
  getFeatureFlags,
  toggleFeature,
  createAnnouncement,
} as const;
