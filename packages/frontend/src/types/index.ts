/* ============================================
   TYPES - Code Repository Platform
   ============================================ */

// ============================================
// USER & AUTH TYPES
// ============================================

export interface User {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  role: 'user' | 'moderator' | 'admin';
  isVerified: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  displayName?: string;
}

// ============================================
// REPOSITORY TYPES
// ============================================

export interface Repository {
  id: string;
  name: string;
  description?: string;
  owner: RepositoryOwner;
  slug: string;
  url: string;
  cloneUrl: string;
  sshUrl: string;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isPrivate: boolean;
  isArchived: boolean;
  isFork: boolean;
  defaultBranch: string;
  language?: string;
  stargazersCount: number;
  watchersCount: number;
  forksCount: number;
  openIssuesCount: number;
  openPullRequestsCount: number;
  size: number;
  license?: License;
  topics: string[];
  avatarUrl?: string;
  hasWiki: boolean;
  hasIssues: boolean;
  hasProjects: boolean;
  hasDownloads: boolean;
  allowForking: boolean;
  webCommitSignoffRequired: boolean;
}

export interface RepositoryOwner {
  id: string;
  username: string;
  type: 'user' | 'organization';
  avatarUrl?: string;
}

export interface License {
  key: string;
  name: string;
  spdxId: string;
  url?: string;
}

export interface RepositorySummary {
  created: string;
  commits: number;
  branches: number;
  tags: number;
  openPullRequests: number;
}

// ============================================
// FILE & TREE TYPES
// ============================================

export interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink' | 'submodule';
  size: number;
  sha: string;
  url: string;
  htmlUrl: string;
  gitUrl: string;
  downloadUrl?: string;
  content?: string;
  encoding?: 'base64' | 'utf-8';
  lastCommit?: CommitInfo;
}

export interface TreeEntry {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | 'commit';
  sha: string;
  size?: number;
  url: string;
}

export interface RepositoryTree {
  sha: string;
  url: string;
  tree: TreeEntry[];
  truncated: boolean;
}

export interface CommitInfo {
  sha: string;
  message: string;
  author: AuthorInfo;
  committer: AuthorInfo;
  timestamp: string;
}

export interface AuthorInfo {
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  date: string;
}

export interface FileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  htmlUrl: string;
  gitUrl: string;
  downloadUrl: string;
  type: string;
  content: string;
  encoding: string;
}

// ============================================
// BRANCH & TAG TYPES
// ============================================

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
  protection?: BranchProtection;
}

export interface BranchProtection {
  enabled: boolean;
  requiredStatusChecks?: {
    enforcementLevel: string;
    contexts: string[];
  };
}

export interface Tag {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  zipballUrl: string;
  tarballUrl: string;
  body?: string;
  annotation?: string;
}

// ============================================
// COMMIT TYPES
// ============================================

export interface Commit {
  sha: string;
  nodeId: string;
  commit: {
    author: AuthorInfo;
    committer: AuthorInfo;
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    url: string;
    commentCount: number;
    verification?: VerificationInfo;
  };
  author: User | null;
  committer: User | null;
  parents: ParentCommit[];
  htmlUrl: string;
  url: string;
}

export interface VerificationInfo {
  verified: boolean;
  reason: string;
  signature?: string;
  payload?: string;
}

export interface ParentCommit {
  sha: string;
  url: string;
  htmlUrl: string;
}

// ============================================
// PULL REQUEST TYPES
// ============================================

export interface PullRequest {
  id: string;
  number: number;
  title: string;
  body?: string;
  state: 'open' | 'closed';
  locked: boolean;
  user: User;
  labels: Label[];
  milestone?: Milestone;
  assignees: User[];
  requestedReviewers: User[];
  head: BranchRef;
  base: BranchRef;
  draft: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  mergedAt?: string;
  mergeCommitSha?: string;
  mergeable?: boolean;
  mergeableState: string;
  comments: number;
  reviewComments: number;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
}

export interface BranchRef {
  label: string;
  ref: string;
  sha: string;
  user: RepositoryOwner;
  repo: Repository;
}

export interface Label {
  id: string;
  name: string;
  description?: string;
  color: string;
  default: boolean;
}

export interface Milestone {
  id: string;
  number: number;
  title: string;
  description?: string;
  state: 'open' | 'closed';
  createdAt: string;
  updatedAt: string;
  dueOn?: string;
  closedAt?: string;
  openIssues: number;
  closedIssues: number;
}

// ============================================
// ISSUE TYPES
// ============================================

export interface Issue {
  id: string;
  number: number;
  title: string;
  body?: string;
  user: User;
  labels: Label[];
  state: 'open' | 'closed';
  locked: boolean;
  assignee: User | null;
  assignees: User[];
  milestone?: Milestone;
  comments: number;
  createdAt: string;
  updatedAt: string;
  closedAt?: string;
  closedBy?: User;
  authorAssociation: string;
  stateReason?: string;
}

// ============================================
// WEBHOOK TYPES
// ============================================

export interface Webhook {
  id: string;
  url: string;
  active: boolean;
  events: string[];
  createdAt: string;
  updatedAt: string;
  config: {
    url: string;
    contentType: string;
    secret?: string;
    insecureSsl: string;
  };
  lastResponse?: {
    code: number | null;
    status: string;
    message: string | null;
  };
}

// ============================================
// SEARCH TYPES
// ============================================

export interface SearchResult<T> {
  totalCount: number;
  incompleteResults: boolean;
  items: T[];
}

export interface SearchFilters {
  type?: 'repositories' | 'code' | 'issues' | 'users' | 'commits';
  language?: string;
  sort?: 'stars' | 'forks' | 'updated' | 'best-match';
  order?: 'asc' | 'desc';
  query: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
    message?: string;
  }>;
  documentationUrl?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  hasMore: boolean;
}

// ============================================
// WORKFLOW & CLUSTER TYPES
// ============================================

export interface Workflow {
  id: string;
  name: string;
  path: string;
  state: 'active' | 'disabled' | 'disabled_manually';
  createdAt: string;
  updatedAt: string;
  url: string;
  htmlUrl: string;
  badgeUrl: string;
  deletedAt?: string;
}

export interface WorkflowRun {
  id: string;
  name: string;
  nodeId: string;
  headBranch: string;
  headSha: string;
  path: string;
  runNumber: number;
  runAttempt: number;
  event: string;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting' | 'requested' | 'pending';
  conclusion: 'success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required' | null;
  workflowId: string;
  url: string;
  htmlUrl: string;
  createdAt: string;
  updatedAt: string;
  runStartedAt: string;
  jobsUrl: string;
  logsUrl: string;
  checkSuiteUrl: string;
  artifactsUrl: string;
  cancelUrl: string;
  rerunUrl: string;
  workflowUrl: string;
}

export interface ClusterNode {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  url: string;
  health: NodeHealth;
  resources: NodeResources;
  lastSeen: string;
  metadata: Record<string, string>;
}

export interface NodeHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  checks: HealthCheck[];
}

export interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  responseTime: number;
  message?: string;
}

export interface NodeResources {
  cpu: ResourceUsage;
  memory: ResourceUsage;
  disk: ResourceUsage;
  network: NetworkUsage;
}

export interface ResourceUsage {
  used: number;
  total: number;
  percentage: number;
}

export interface NetworkUsage {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface Notification {
  id: string;
  repository: Repository;
  subject: {
    title: string;
    url: string;
    latestCommentUrl: string;
    type: 'issue' | 'pull_request' | 'discussion' | 'commit' | 'release';
  };
  reason: string;
  unread: boolean;
  updatedAt: string;
  lastReadAt?: string;
  url: string;
}

// ============================================
// SETTINGS TYPES
// ============================================

export interface RepositorySettings {
  defaultBranch: string;
  allowMergeCommit: boolean;
  allowSquashMerge: boolean;
  allowRebaseMerge: boolean;
  allowAutoMerge: boolean;
  deleteBranchOnMerge: boolean;
  allowUpdateBranch: boolean;
  mergeCommitTitle: 'PR_TITLE' | 'MERGE_MESSAGE';
  mergeCommitMessage: 'PR_BODY' | 'PR_TITLE' | 'BLANK';
  squashMergeCommitTitle: 'PR_TITLE' | 'COMMIT_OR_PR_TITLE';
  squashMergeCommitMessage: 'PR_BODY' | 'COMMIT_MESSAGES' | 'BLANK';
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  security: SecuritySettings;
}

export interface NotificationSettings {
  email: boolean;
  web: boolean;
  participating: boolean;
  watching: boolean;
  mentions: boolean;
}

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  sshKeys: SSHKey[];
  gpgKeys: GPGKey[];
  sessions: Session[];
}

export interface SSHKey {
  id: string;
  title: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface GPGKey {
  id: string;
  primaryKeyId: string;
  keyId: string;
  publicKey: string;
  emails: string[];
  subkeys: string[];
  canSign: boolean;
  canEncryptComms: boolean;
  canEncryptStorage: boolean;
  canCertify: boolean;
  createdAt: string;
  expiresAt?: string;
  rawKey: string;
}

export interface Session {
  id: string;
  ip: string;
  userAgent: string;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  isCurrent: boolean;
}
