/**
 * Role definitions for role-based access control (RBAC).
 * @module permissions/role-definitions
 */

/**
 * A role that bundles a set of permissions.
 */
export interface Role {
  /** Unique identifier for the role. */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of the role's purpose. */
  description: string;
  /** Scope at which this role operates. */
  scope: RoleScope;
  /** Whether this is a built-in system role. */
  isBuiltIn: boolean;
  /** Whether this role can be assigned to users. */
  isAssignable: boolean;
  /** Permissions included in this role. */
  permissions: RolePermission[];
  /** ID of the organization (null for global roles). */
  organizationId: string | null;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * Scope at which a role operates.
 */
export type RoleScope = "global" | "organization" | "project" | "team";

/**
 * A permission entry within a role.
 */
export interface RolePermission {
  /** Resource type this permission applies to. */
  resourceType: string;
  /** Allowed actions on the resource type. */
  actions: string[];
  /** Whether this permission includes the resource's children. */
  includeChildren: boolean;
}

/**
 * An assignment of a role to a user for a specific scope.
 */
export interface RoleAssignment {
  /** Unique identifier for the assignment. */
  id: string;
  /** ID of the role being assigned. */
  roleId: string;
  /** ID of the user receiving the role. */
  userId: string;
  /** Scope at which the role is assigned. */
  scope: RoleScope;
  /** ID of the scoped resource (org, project, or team). */
  scopeId: string;
  /** ID of the user who made the assignment. */
  assignedBy: string;
  /** ISO-8601 timestamp of the assignment. */
  assignedAt: string;
  /** ISO-8601 expiration timestamp (if temporary). */
  expiresAt?: string;
}

/**
 * Built-in role identifiers used by the platform.
 */
export type BuiltInRoleId =
  | "owner"
  | "admin"
  | "member"
  | "viewer"
  | "billing_admin"
  | "security_admin"
  | "deployment_manager"
  | "guest";

/**
 * Describes a built-in role with its default permissions.
 */
export interface BuiltInRoleDefinition {
  /** Built-in role identifier. */
  id: BuiltInRoleId;
  /** Human-readable name. */
  name: string;
  /** Description. */
  description: string;
  /** Default permissions. */
  permissions: RolePermission[];
  /** Hierarchy level (lower = more powerful). */
  hierarchyLevel: number;
  /** Whether this role can manage other roles. */
  canManageRoles: boolean;
}

/**
 * Request to create a custom role.
 */
export interface CreateRoleRequest {
  /** Name for the new role. */
  name: string;
  /** Description. */
  description: string;
  /** Scope of the role. */
  scope: RoleScope;
  /** Permissions to include. */
  permissions: RolePermission[];
  /** ID of the organization (required for org-scoped roles). */
  organizationId?: string;
}

/**
 * Summary of all roles assigned to a user.
 */
export interface UserRoleSummary {
  /** ID of the user. */
  userId: string;
  /** Role assignments grouped by scope. */
  assignments: RoleAssignment[];
  /** Effective permissions computed from all role assignments. */
  effectivePermissions: RolePermission[];
}
