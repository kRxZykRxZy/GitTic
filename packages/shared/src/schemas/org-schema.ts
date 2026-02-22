/**
 * Organization schema types for validation and API contracts.
 * @module schemas/org-schema
 */

/**
 * Schema for creating a new organization.
 */
export interface CreateOrgSchema {
  /** Organization name (1-100 characters). */
  name: string;
  /** URL-friendly slug (auto-generated if not provided). */
  slug?: string;
  /** Description of the organization. */
  description?: string;
  /** URL to the organization's logo. */
  logoUrl?: string;
  /** Organization's website URL. */
  websiteUrl?: string;
  /** Billing email address. */
  billingEmail: string;
  /** Initial plan tier. */
  plan?: OrgPlanTier;
}

/**
 * Schema for updating an existing organization.
 */
export interface UpdateOrgSchema {
  /** Updated name. */
  name?: string;
  /** Updated description. */
  description?: string;
  /** Updated logo URL. */
  logoUrl?: string;
  /** Updated website URL. */
  websiteUrl?: string;
  /** Updated billing email. */
  billingEmail?: string;
  /** Updated default role for new members. */
  defaultMemberRole?: OrgMemberRoleSchema;
}

/**
 * Plan tiers available for organizations.
 */
export type OrgPlanTier = "free" | "starter" | "professional" | "enterprise";

/**
 * Roles that can be assigned to organization members.
 */
export type OrgMemberRoleSchema = "owner" | "admin" | "member" | "billing" | "guest";

/**
 * Schema for inviting a user to an organization.
 */
export interface InviteOrgMemberSchema {
  /** Email address of the person to invite. */
  email: string;
  /** Role to assign upon acceptance. */
  role: OrgMemberRoleSchema;
  /** IDs of teams to add the member to. */
  teamIds?: string[];
  /** Custom message included in the invitation email. */
  message?: string;
  /** ISO-8601 expiration for the invitation. */
  expiresAt?: string;
}

/**
 * Schema for creating a team within an organization.
 */
export interface CreateTeamSchema {
  /** Team name. */
  name: string;
  /** URL-friendly slug. */
  slug?: string;
  /** Description. */
  description?: string;
  /** Visibility of the team. */
  visibility: TeamVisibilitySchema;
  /** IDs of initial team members. */
  memberIds?: string[];
  /** ID of a parent team. */
  parentTeamId?: string;
}

/**
 * Schema for updating a team.
 */
export interface UpdateTeamSchema {
  /** Updated name. */
  name?: string;
  /** Updated description. */
  description?: string;
  /** Updated visibility. */
  visibility?: TeamVisibilitySchema;
  /** Updated parent team ID. */
  parentTeamId?: string | null;
}

/**
 * Visibility levels for teams.
 */
export type TeamVisibilitySchema = "visible" | "secret";

/**
 * Schema for organization-level settings.
 */
export interface OrgSettingsSchema {
  /** Whether two-factor authentication is required for all members. */
  requireTwoFactor: boolean;
  /** Default repository visibility for new projects. */
  defaultProjectVisibility: "public" | "private" | "internal";
  /** Allowed email domains for members (empty means all allowed). */
  allowedEmailDomains: string[];
  /** Whether members can create projects. */
  membersCanCreateProjects: boolean;
  /** Whether members can invite other members. */
  membersCanInvite: boolean;
  /** IP allowlist for API access (empty means all allowed). */
  ipAllowlist: string[];
}

/**
 * Schema for searching organizations.
 */
export interface OrgSearchSchema {
  /** Search query. */
  query?: string;
  /** Filter by plan tier. */
  plan?: OrgPlanTier;
  /** Page number. */
  page?: number;
  /** Items per page. */
  perPage?: number;
}
