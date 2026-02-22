/**
 * Subscription and plan types for SaaS subscription management.
 * @module models/subscription
 */

/**
 * Subscription status lifecycle states.
 */
export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"
  | "expired";

/**
 * Billing interval for a subscription plan.
 */
export type BillingInterval = "monthly" | "yearly" | "quarterly";

/**
 * Tier identifiers for platform plans.
 */
export type PlanTier = "free" | "starter" | "professional" | "enterprise" | "custom";

/**
 * An active subscription belonging to an organization.
 */
export interface Subscription {
  /** Unique identifier for the subscription. */
  id: string;
  /** ID of the organization that owns this subscription. */
  organizationId: string;
  /** ID of the plan this subscription is for. */
  planId: string;
  /** Current status of the subscription. */
  status: SubscriptionStatus;
  /** Billing interval. */
  interval: BillingInterval;
  /** Number of licensed seats. */
  seats: number;
  /** ISO-8601 date when the current period started. */
  currentPeriodStart: string;
  /** ISO-8601 date when the current period ends. */
  currentPeriodEnd: string;
  /** Whether the subscription will cancel at period end. */
  cancelAtPeriodEnd: boolean;
  /** ISO-8601 trial start date (if applicable). */
  trialStart?: string;
  /** ISO-8601 trial end date (if applicable). */
  trialEnd?: string;
  /** ISO-8601 creation timestamp. */
  createdAt: string;
  /** ISO-8601 last-updated timestamp. */
  updatedAt: string;
}

/**
 * A plan that can be subscribed to.
 */
export interface Plan {
  /** Unique identifier for the plan. */
  id: string;
  /** Human-readable name of the plan. */
  name: string;
  /** Short description of the plan. */
  description: string;
  /** Plan tier. */
  tier: PlanTier;
  /** Monthly price in cents. */
  monthlyPriceCents: number;
  /** Yearly price in cents. */
  yearlyPriceCents: number;
  /** Features included in this plan. */
  features: PlanFeature[];
  /** Resource limits for this plan. */
  limits: PlanLimits;
  /** Whether this plan is currently available for new subscriptions. */
  isActive: boolean;
  /** Display order in the pricing page. */
  sortOrder: number;
}

/**
 * A feature included in a plan.
 */
export interface PlanFeature {
  /** Machine-readable feature identifier. */
  id: string;
  /** Human-readable feature name. */
  name: string;
  /** Short description of the feature. */
  description: string;
  /** Whether this feature is included in the plan. */
  included: boolean;
  /** Optional limit value (e.g., "100 builds/month"). */
  limitDescription?: string;
}

/**
 * Resource limits enforced for a plan.
 */
export interface PlanLimits {
  /** Maximum number of projects. */
  maxProjects: number;
  /** Maximum number of team members. */
  maxMembers: number;
  /** Storage limit in megabytes. */
  storageMb: number;
  /** Monthly build minutes. */
  buildMinutes: number;
  /** Maximum number of environments per project. */
  maxEnvironments: number;
  /** Maximum number of concurrent pipeline runs. */
  maxConcurrentPipelines: number;
  /** Maximum number of webhooks. */
  maxWebhooks: number;
  /** Data retention period in days. */
  retentionDays: number;
}
