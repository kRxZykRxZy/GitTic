import type { UserRole } from "@platform/shared";

/**
 * Permission definitions for each role.
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  user: 0,
  moderator: 1,
  admin: 2,
};

/**
 * Check if a role meets the minimum required role level.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Permission keys for fine-grained access control.
 */
export type Permission =
  | "repo:read"
  | "repo:write"
  | "repo:delete"
  | "repo:admin"
  | "user:read"
  | "user:write"
  | "user:suspend"
  | "user:ban"
  | "user:delete"
  | "org:create"
  | "org:manage"
  | "cluster:read"
  | "cluster:manage"
  | "pipeline:run"
  | "pipeline:manage"
  | "moderation:read"
  | "moderation:manage"
  | "admin:dashboard"
  | "admin:features"
  | "admin:announcements"
  | "admin:database"
  | "analytics:read";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  user: [
    "repo:read",
    "repo:write",
    "user:read",
    "org:create",
    "pipeline:run",
  ],
  moderator: [
    "repo:read",
    "repo:write",
    "user:read",
    "user:write",
    "user:suspend",
    "user:ban",
    "org:create",
    "org:manage",
    "pipeline:run",
    "moderation:read",
    "moderation:manage",
    "analytics:read",
  ],
  admin: [
    "repo:read",
    "repo:write",
    "repo:delete",
    "repo:admin",
    "user:read",
    "user:write",
    "user:suspend",
    "user:ban",
    "user:delete",
    "org:create",
    "org:manage",
    "cluster:read",
    "cluster:manage",
    "pipeline:run",
    "pipeline:manage",
    "moderation:read",
    "moderation:manage",
    "admin:dashboard",
    "admin:features",
    "admin:announcements",
    "admin:database",
    "analytics:read",
  ],
};

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/**
 * Get all permissions for a role.
 */
export function getPermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
