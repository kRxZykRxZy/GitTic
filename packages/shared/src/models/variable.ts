/**
 * Variable types for configuring projects and pipelines.
 * @module models/variable
 */

/**
 * Scope at which a variable is accessible.
 */
export type VariableScope = "global" | "organization" | "project" | "environment" | "pipeline";

/**
 * Data type of a variable value.
 */
export type VariableValueType = "string" | "number" | "boolean" | "json";

/**
 * Visibility of a variable in logs and UI.
 */
export type VariableVisibility = "visible" | "masked" | "hidden";

/**
 * A configuration variable used in pipelines and deployments.
 */
export interface Variable {
  /** Unique identifier. */
  id: string;
  /** Variable key / name. */
  key: string;
  /** Variable value. */
  value: string;
  /** Description of what this variable is used for. */
  description?: string;
  /** Data type of the value. */
  valueType: VariableValueType;
  /** Scope at which this variable is defined. */
  scope: VariableScope;
  /** ID of the owning resource (org, project, environment, etc.). */
  scopeId: string;
  /** Visibility in logs and UI. */
  visibility: VariableVisibility;
  /** Whether this variable can be overridden at a narrower scope. */
  isOverridable: boolean;
  /** Whether this variable is required. */
  isRequired: boolean;
  /** Default value when no override is provided. */
  defaultValue?: string;
  /** ID of the user who created the variable. */
  createdBy: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * A group of related variables.
 */
export interface VariableGroup {
  /** Unique identifier. */
  id: string;
  /** Human-readable name of the group. */
  name: string;
  /** Description. */
  description?: string;
  /** ID of the organization this group belongs to. */
  organizationId: string;
  /** Variables in this group. */
  variables: Variable[];
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * An override applied to a variable at a narrower scope.
 */
export interface VariableOverride {
  /** Unique identifier. */
  id: string;
  /** ID of the variable being overridden. */
  variableId: string;
  /** Scope at which the override is applied. */
  scope: VariableScope;
  /** ID of the resource at the override scope. */
  scopeId: string;
  /** The overridden value. */
  value: string;
  /** ID of the user who created the override. */
  createdBy: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
}

/**
 * Resolved variable after applying all overrides in scope chain.
 */
export interface ResolvedVariable {
  /** Variable key. */
  key: string;
  /** Resolved value after applying overrides. */
  value: string;
  /** Data type. */
  valueType: VariableValueType;
  /** Scope at which the final value was resolved from. */
  resolvedFromScope: VariableScope;
  /** ID of the source resource. */
  resolvedFromScopeId: string;
  /** Whether the value was overridden from the original definition. */
  isOverridden: boolean;
}

/**
 * Request to validate a set of variables against requirements.
 */
export interface VariableValidationRequest {
  /** Variables to validate. */
  variables: Array<{ key: string; value: string }>;
  /** Scope context for validation. */
  scope: VariableScope;
  /** ID of the scope resource. */
  scopeId: string;
}

/**
 * Result of variable validation.
 */
export interface VariableValidationResult {
  /** Whether all variables are valid. */
  valid: boolean;
  /** List of validation errors. */
  errors: VariableValidationError[];
}

/**
 * A validation error for a specific variable.
 */
export interface VariableValidationError {
  /** Key of the variable with the error. */
  key: string;
  /** Human-readable error message. */
  message: string;
  /** Error code. */
  code: "missing_required" | "invalid_type" | "invalid_value" | "duplicate_key";
}
