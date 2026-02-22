/**
 * Policy types for defining access control rules.
 * @module permissions/policies
 */
/**
 * Effect of a policy statement.
 */
export type PolicyEffect = "allow" | "deny";
/**
 * A policy document defining access control rules.
 */
export interface Policy {
    /** Unique identifier for the policy. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** Description of the policy's purpose. */
    description: string;
    /** Version of the policy (incremented on each update). */
    version: number;
    /** Ordered list of policy statements evaluated top-to-bottom. */
    statements: PolicyStatement[];
    /** Whether this is a system-managed policy. */
    isSystemManaged: boolean;
    /** ID of the organization this policy belongs to (null for global policies). */
    organizationId: string | null;
    /** ISO-8601 creation timestamp. */
    createdAt: string;
    /** ISO-8601 last-updated timestamp. */
    updatedAt: string;
}
/**
 * A single statement within a policy, defining a specific rule.
 */
export interface PolicyStatement {
    /** Unique identifier for the statement within the policy. */
    sid: string;
    /** Whether this statement allows or denies access. */
    effect: PolicyEffect;
    /** Actions this statement applies to. */
    actions: string[];
    /** Resources this statement applies to (supports wildcards). */
    resources: string[];
    /** Optional conditions that must be met for this statement to apply. */
    conditions?: PolicyCondition[];
}
/**
 * A condition that narrows when a policy statement applies.
 */
export interface PolicyCondition {
    /** The attribute or context key to evaluate. */
    key: string;
    /** The comparison operator. */
    operator: PolicyConditionOperator;
    /** The value(s) to compare against. */
    values: string[];
}
/**
 * Operators for policy conditions.
 */
export type PolicyConditionOperator = "equals" | "not_equals" | "in" | "not_in" | "starts_with" | "ends_with" | "ip_address" | "date_greater_than" | "date_less_than";
/**
 * Result of evaluating a set of policies against a request.
 */
export interface PolicyEvaluationResult {
    /** Whether access is allowed. */
    allowed: boolean;
    /** The statement that made the final decision. */
    matchedStatement?: PolicyStatement;
    /** The policy containing the matched statement. */
    matchedPolicyId?: string;
    /** Reason the decision was made. */
    reason: PolicyDecisionReason;
    /** Policies that were evaluated. */
    evaluatedPolicies: string[];
}
/**
 * Reasons for a policy decision.
 */
export type PolicyDecisionReason = "explicit_allow" | "explicit_deny" | "no_matching_statement" | "implicit_deny" | "condition_not_met";
/**
 * A policy attachment linking a policy to a principal.
 */
export interface PolicyAttachment {
    /** Unique identifier for the attachment. */
    id: string;
    /** ID of the policy being attached. */
    policyId: string;
    /** Type of principal the policy is attached to. */
    principalType: PolicyPrincipalType;
    /** ID of the principal. */
    principalId: string;
    /** ISO-8601 timestamp of the attachment. */
    attachedAt: string;
    /** ID of the user who created the attachment. */
    attachedBy: string;
}
/**
 * Types of principals that policies can be attached to.
 */
export type PolicyPrincipalType = "user" | "role" | "team" | "api_key" | "service_account";
//# sourceMappingURL=policies.d.ts.map