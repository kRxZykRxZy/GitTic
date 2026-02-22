/**
 * Access control list types for fine-grained resource permissions.
 * @module permissions/access-control
 */
/**
 * An access control entry granting or denying a permission.
 */
export interface AccessControlEntry {
    /** Unique identifier for this entry. */
    id: string;
    /** ID of the principal this entry applies to. */
    principalId: string;
    /** Type of the principal. */
    principalType: AclPrincipalType;
    /** Type of the resource. */
    resourceType: string;
    /** ID of the resource. */
    resourceId: string;
    /** Permission level granted. */
    permission: PermissionLevel;
    /** Whether this entry is inherited from a parent resource. */
    inherited: boolean;
    /** ID of the source resource if inherited. */
    inheritedFrom?: string;
    /** ID of the user who created this entry. */
    grantedBy: string;
    /** ISO-8601 timestamp of the grant. */
    grantedAt: string;
    /** ISO-8601 expiration timestamp (if temporary). */
    expiresAt?: string;
}
/**
 * Types of principals in the ACL system.
 */
export type AclPrincipalType = "user" | "team" | "role" | "service_account" | "everyone";
/**
 * Permission levels from least to most permissive.
 */
export type PermissionLevel = "none" | "read" | "write" | "admin" | "owner";
/**
 * Complete access control list for a resource.
 */
export interface AccessControlList {
    /** Type of the resource this ACL belongs to. */
    resourceType: string;
    /** ID of the resource. */
    resourceId: string;
    /** Entries in the ACL. */
    entries: AccessControlEntry[];
    /** Whether the ACL inherits from parent resources. */
    inheritanceEnabled: boolean;
    /** ISO-8601 last-updated timestamp. */
    updatedAt: string;
}
/**
 * Request to grant a permission.
 */
export interface GrantPermissionRequest {
    /** ID of the principal to grant the permission to. */
    principalId: string;
    /** Type of the principal. */
    principalType: AclPrincipalType;
    /** Type of the resource. */
    resourceType: string;
    /** ID of the resource. */
    resourceId: string;
    /** Permission level to grant. */
    permission: PermissionLevel;
    /** Optional expiration for the grant. */
    expiresAt?: string;
}
/**
 * Request to revoke a permission.
 */
export interface RevokePermissionRequest {
    /** ID of the ACL entry to revoke. */
    entryId: string;
    /** Reason for revocation. */
    reason?: string;
}
/**
 * Summary of a principal's effective permissions on a resource.
 */
export interface EffectivePermissions {
    /** ID of the principal. */
    principalId: string;
    /** Type of the resource. */
    resourceType: string;
    /** ID of the resource. */
    resourceId: string;
    /** Effective permission level (highest granted). */
    effectiveLevel: PermissionLevel;
    /** Individual permissions broken down by source. */
    permissionSources: PermissionSource[];
}
/**
 * Source of a specific permission grant.
 */
export interface PermissionSource {
    /** Where the permission comes from. */
    sourceType: PermissionSourceType;
    /** ID of the source (role, team, direct grant, etc.). */
    sourceId: string;
    /** Human-readable name of the source. */
    sourceName: string;
    /** Permission level from this source. */
    permission: PermissionLevel;
}
/**
 * Types of permission sources.
 */
export type PermissionSourceType = "direct" | "role" | "team" | "inherited" | "organization_default";
//# sourceMappingURL=access-control.d.ts.map