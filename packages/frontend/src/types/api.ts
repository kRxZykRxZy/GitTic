/** Generic API response wrapper */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

/** Paginated response with metadata */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** User roles */
export type UserRole = "user" | "moderator" | "admin";

/** User account status */
export type AccountStatus = "active" | "suspended" | "banned" | "deleted";

/** User entity */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: AccountStatus;
  bio?: string;
  avatarUrl?: string;
  country?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  projectCount: number;
  followerCount: number;
  followingCount: number;
}

/** Project visibility */
export type ProjectVisibility = "public" | "private" | "internal";

/** Project entity */
export interface Project {
  id: string;
  name: string;
  description: string;
  visibility: ProjectVisibility;
  ownerId: string;
  ownerUsername: string;
  language?: string;
  stars: number;
  forks: number;
  openIssues: number;
  defaultBranch: string;
  hasReadme: boolean;
  size: number;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
}

/** Organization entity */
export interface Organization {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  avatarUrl?: string;
  memberCount: number;
  projectCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Cluster node status */
export type ClusterNodeStatus = "online" | "offline" | "draining" | "maintenance";

/** Cluster node entity */
export interface ClusterNode {
  id: string;
  hostname: string;
  ipAddress: string;
  status: ClusterNodeStatus;
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  activeJobs: number;
  maxJobs: number;
  capabilities: string[];
  region: string;
  lastHeartbeat: string;
  registeredAt: string;
}

/** Pipeline run status */
export type PipelineStatus = "pending" | "running" | "success" | "failure" | "cancelled";

/** Pipeline run entity */
export interface PipelineRun {
  id: string;
  projectId: string;
  branch: string;
  commitSha: string;
  status: PipelineStatus;
  startedAt?: string;
  finishedAt?: string;
  duration?: number;
  triggeredBy: string;
  stages: PipelineStage[];
  createdAt: string;
}

/** Pipeline stage */
export interface PipelineStage {
  name: string;
  status: PipelineStatus;
  duration?: number;
  logs?: string;
}

/** Search result types */
export type SearchResultType = "project" | "user" | "code" | "issue";

/** Search result entity */
export interface SearchResult {
  type: SearchResultType;
  id: string;
  title: string;
  description: string;
  url: string;
  highlights: string[];
  score: number;
  metadata: Record<string, unknown>;
}

/** Audit log action types */
export type AuditAction =
  | "user.login"
  | "user.logout"
  | "user.register"
  | "user.update"
  | "user.delete"
  | "project.create"
  | "project.update"
  | "project.delete"
  | "admin.role_change"
  | "admin.suspend"
  | "admin.ban";

/** Audit log entity */
export interface AuditLog {
  id: string;
  action: AuditAction;
  actorId: string;
  actorUsername: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

/** Metric data point */
export interface Metric {
  label: string;
  value: number;
  timestamp: string;
  unit?: string;
}

/** Announcement severity */
export type AnnouncementType = "info" | "warning" | "critical";

/** Announcement entity */
export interface Announcement {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  active: boolean;
  createdBy: string;
  createdAt: string;
  expiresAt?: string;
}

/** Feature flag entity */
export interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Moderation report status */
export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";

/** Moderation report target type */
export type ReportTargetType = "user" | "project" | "comment" | "issue";

/** Moderation report entity */
export interface ModerationReport {
  id: string;
  targetId: string;
  targetType: ReportTargetType;
  reason: string;
  description: string;
  status: ReportStatus;
  reporterId: string;
  reporterUsername: string;
  assigneeId?: string;
  assigneeUsername?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

/** Auth tokens */
export interface AuthTokens {
  token: string;
  refreshToken: string;
  user?: {
    id: string;
    username: string;
    email: string;
    role: UserRole;
  };
}

/** Login request */
export interface LoginRequest {
  login: string;
  password: string;
}

/** Register request */
export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  country?: string;
  ageVerified: boolean;
  termsAccepted: boolean;
}

/** Dashboard stats */
export interface DashboardStats {
  totalUsers: number;
  totalProjects: number;
  totalClusters: number;
  activeConnections: number;
  userGrowth: Metric[];
  projectTrends: Metric[];
}

/** Project stats */
export interface ProjectStats {
  stars: number;
  forks: number;
  clones: number;
  views: number;
  contributors: number;
}
