/**
 * Shared types for repository settings and management
 * @module @platform/shared/types/repository
 */

export type RepositoryVisibility = 'public' | 'private' | 'internal';

export type CollaboratorPermission = 'pull' | 'triage' | 'push' | 'maintain' | 'admin';

export interface RepositorySettings {
  name: string;
  description: string;
  visibility: RepositoryVisibility;
  defaultBranch: string;
  hasIssues: boolean;
  hasProjects: boolean;
  hasWiki: boolean;
  allowMergeCommit: boolean;
  allowSquashMerge: boolean;
  allowRebaseMerge: boolean;
  deleteBranchOnMerge: boolean;
  archived: boolean;
  disabled: boolean;
}

export interface Collaborator {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: CollaboratorPermission;
  permissions: CollaboratorPermissions;
  addedAt: string;
}

export interface CollaboratorPermissions {
  admin: boolean;
  maintain: boolean;
  push: boolean;
  triage: boolean;
  pull: boolean;
}

export interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  contentType: 'json' | 'form';
  insecureSSL: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeployKey {
  id: string;
  title: string;
  key: string;
  readOnly: boolean;
  verified: boolean;
  createdAt: string;
}

export interface BranchProtectionRule {
  id?: string;
  pattern: string;
  requirePullRequest: boolean;
  requiredApprovingReviewCount: number;
  dismissStaleReviews: boolean;
  requireCodeOwnerReviews: boolean;
  requireStatusChecks: boolean;
  requiredStatusChecks: string[];
  strict: boolean;
  enforceAdmins: boolean;
  requireLinearHistory: boolean;
  allowForcePushes: boolean;
  allowDeletions: boolean;
  requireSignedCommits: boolean;
}


export interface RepositoryStatsResponse {
  commits: number;
  branches: number;
  tags: number;
  openPullRequests: number;
  stars: number;
  forks: number;
}

export interface RepositorySearchResult {
  path: string;
  content: string;
  lineNumbers: number[];
  language: string;
}

export interface RepositorySearchPagination {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  capped: boolean;
}

export interface RepositorySearchResponse {
  query: string;
  repository: string;
  results: RepositorySearchResult[];
  pagination: RepositorySearchPagination;
  total: number;
}
