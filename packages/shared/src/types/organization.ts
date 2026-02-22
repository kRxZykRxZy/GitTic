/**
 * Shared types for organization management
 * @module @platform/shared/types/organization
 */

export type OrganizationRole = 'member' | 'admin' | 'owner';

export type TeamPrivacy = 'secret' | 'closed';

export type TeamPermission = 'pull' | 'push' | 'admin' | 'maintain' | 'triage';

export interface Organization {
  id: string;
  login: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  email?: string;
  location?: string;
  website?: string;
  createdAt: string;
  updatedAt: string;
  publicRepos: number;
  privateRepos: number;
  totalRepos: number;
  members: number;
}

export interface OrganizationMember {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  role: OrganizationRole;
  joinedAt: string;
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  privacy: TeamPrivacy;
  permission?: TeamPermission;
  membersCount: number;
  reposCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  username: string;
  avatarUrl?: string;
  role: 'member' | 'maintainer';
  joinedAt: string;
}

export interface TeamRepository {
  id: string;
  name: string;
  fullName: string;
  private: boolean;
  permission: TeamPermission;
  addedAt: string;
}

export interface OrganizationSettings {
  name: string;
  description?: string;
  email?: string;
  location?: string;
  website?: string;
  billingEmail?: string;
  defaultRepositoryPermission: 'read' | 'write' | 'admin' | 'none';
  membersCanCreateRepos: boolean;
  membersCanCreatePrivateRepos: boolean;
  membersCanCreatePages: boolean;
  twoFactorRequirement: boolean;
}
