/**
 * Resource types used in the access control system.
 * @module permissions/resource-types
 */

/**
 * A resource type registered in the access control system.
 */
export interface ResourceType {
  /** Unique machine-readable identifier (e.g., "project", "pipeline"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of this resource type. */
  description: string;
  /** Actions that can be performed on this resource type. */
  actions: ResourceAction[];
  /** Parent resource type (for hierarchical resources). */
  parentType?: string;
  /** Whether resources of this type are scoped to an organization. */
  isOrganizationScoped: boolean;
}

/**
 * An action that can be performed on a resource.
 */
export interface ResourceAction {
  /** Action identifier (e.g., "read", "write", "delete"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Description of what this action does. */
  description: string;
  /** Whether this action is considered dangerous / destructive. */
  isDangerous: boolean;
}

/**
 * Identifies a specific resource instance for access control.
 */
export interface ResourceIdentifier {
  /** Type of the resource. */
  type: ResourceTypeName;
  /** ID of the resource instance. */
  id: string;
  /** ID of the organization the resource belongs to. */
  organizationId: string;
  /** Optional parent resource identifier. */
  parent?: ResourceIdentifier;
}

/**
 * Known resource type names used in the platform.
 */
export type ResourceTypeName =
  | "organization"
  | "project"
  | "pipeline"
  | "deployment"
  | "environment"
  | "cluster"
  | "secret"
  | "variable"
  | "webhook"
  | "integration"
  | "team"
  | "user"
  | "api_key"
  | "service_account";

/**
 * Resource hierarchy definition for permission inheritance.
 */
export interface ResourceHierarchy {
  /** The resource type. */
  type: ResourceTypeName;
  /** Child resource types that inherit permissions. */
  children: ResourceTypeName[];
}

/**
 * A request to check access to a specific resource.
 */
export interface AccessCheckRequest {
  /** ID of the principal requesting access. */
  principalId: string;
  /** Type of the principal. */
  principalType: PrincipalType;
  /** The resource being accessed. */
  resource: ResourceIdentifier;
  /** The action being performed. */
  action: string;
  /** Additional context for the access check. */
  context?: AccessCheckContext;
}

/**
 * Principal types that can request access to resources.
 */
export type PrincipalType =
  | "user"
  | "service_account"
  | "api_key"
  | "team";

/**
 * Additional context provided with an access check request.
 */
export interface AccessCheckContext {
  /** IP address of the requester. */
  ipAddress?: string;
  /** ISO-8601 timestamp of the request. */
  timestamp?: string;
  /** Environment from which the request originates. */
  environment?: string;
  /** Additional context attributes. */
  attributes?: Record<string, string>;
}

/**
 * Result of an access check.
 */
export interface AccessCheckResult {
  /** Whether access is granted. */
  allowed: boolean;
  /** Reason for the decision. */
  reason: string;
  /** Policies that were evaluated. */
  evaluatedPolicies: string[];
}
