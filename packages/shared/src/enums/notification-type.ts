/**
 * Notification type enums for the notification system.
 * @module enums/notification-type
 */

/**
 * Categories of notifications.
 */
export enum NotificationCategoryEnum {
  /** System-wide announcements and updates. */
  System = "system",
  /** Security-related notifications (login, password change). */
  Security = "security",
  /** Project activity notifications. */
  Project = "project",
  /** Pipeline status notifications. */
  Pipeline = "pipeline",
  /** Deployment status notifications. */
  Deployment = "deployment",
  /** Collaboration notifications (comments, reviews). */
  Collaboration = "collaboration",
  /** Billing and subscription notifications. */
  Billing = "billing",
  /** Mentions in comments or discussions. */
  Mention = "mention",
  /** Code review notifications. */
  Review = "review",
  /** Alert notifications from monitoring. */
  Alert = "alert",
}

/**
 * Specific notification type identifiers.
 */
export enum NotificationTypeId {
  /** New comment on a pull request. */
  PrComment = "pr.comment",
  /** Pull request review requested. */
  PrReviewRequested = "pr.review_requested",
  /** Pull request approved. */
  PrApproved = "pr.approved",
  /** Pull request changes requested. */
  PrChangesRequested = "pr.changes_requested",
  /** Pull request merged. */
  PrMerged = "pr.merged",
  /** Pipeline run succeeded. */
  PipelineSuccess = "pipeline.success",
  /** Pipeline run failed. */
  PipelineFailure = "pipeline.failure",
  /** Deployment succeeded. */
  DeploymentSuccess = "deployment.success",
  /** Deployment failed. */
  DeploymentFailure = "deployment.failure",
  /** User was mentioned in a comment. */
  Mentioned = "mentioned",
  /** User was assigned to an issue. */
  Assigned = "assigned",
  /** Team membership invitation. */
  TeamInvitation = "team.invitation",
  /** Security alert (suspicious login). */
  SecurityAlert = "security.alert",
  /** Password was changed. */
  PasswordChanged = "security.password_changed",
  /** Billing payment succeeded. */
  PaymentSucceeded = "billing.payment_succeeded",
  /** Billing payment failed. */
  PaymentFailed = "billing.payment_failed",
  /** Subscription expiring soon. */
  SubscriptionExpiring = "billing.subscription_expiring",
  /** Usage quota warning. */
  QuotaWarning = "billing.quota_warning",
  /** System maintenance scheduled. */
  MaintenanceScheduled = "system.maintenance_scheduled",
  /** New platform feature announcement. */
  FeatureAnnouncement = "system.feature_announcement",
}

/**
 * Display labels for notification categories.
 */
export const NOTIFICATION_CATEGORY_LABELS: Record<NotificationCategoryEnum, string> = {
  [NotificationCategoryEnum.System]: "System",
  [NotificationCategoryEnum.Security]: "Security",
  [NotificationCategoryEnum.Project]: "Project",
  [NotificationCategoryEnum.Pipeline]: "Pipeline",
  [NotificationCategoryEnum.Deployment]: "Deployment",
  [NotificationCategoryEnum.Collaboration]: "Collaboration",
  [NotificationCategoryEnum.Billing]: "Billing",
  [NotificationCategoryEnum.Mention]: "Mentions",
  [NotificationCategoryEnum.Review]: "Reviews",
  [NotificationCategoryEnum.Alert]: "Alerts",
} as const;

/**
 * Icons for notification categories.
 */
export const NOTIFICATION_CATEGORY_ICONS: Record<NotificationCategoryEnum, string> = {
  [NotificationCategoryEnum.System]: "megaphone",
  [NotificationCategoryEnum.Security]: "shield",
  [NotificationCategoryEnum.Project]: "folder",
  [NotificationCategoryEnum.Pipeline]: "play-circle",
  [NotificationCategoryEnum.Deployment]: "rocket",
  [NotificationCategoryEnum.Collaboration]: "message-circle",
  [NotificationCategoryEnum.Billing]: "credit-card",
  [NotificationCategoryEnum.Mention]: "at-sign",
  [NotificationCategoryEnum.Review]: "check-circle",
  [NotificationCategoryEnum.Alert]: "alert-triangle",
} as const;

/**
 * Default enabled channels per notification category.
 */
export const DEFAULT_NOTIFICATION_CHANNELS: Record<NotificationCategoryEnum, string[]> = {
  [NotificationCategoryEnum.System]: ["in_app"],
  [NotificationCategoryEnum.Security]: ["in_app", "email"],
  [NotificationCategoryEnum.Project]: ["in_app"],
  [NotificationCategoryEnum.Pipeline]: ["in_app"],
  [NotificationCategoryEnum.Deployment]: ["in_app", "email"],
  [NotificationCategoryEnum.Collaboration]: ["in_app", "email"],
  [NotificationCategoryEnum.Billing]: ["in_app", "email"],
  [NotificationCategoryEnum.Mention]: ["in_app", "email"],
  [NotificationCategoryEnum.Review]: ["in_app", "email"],
  [NotificationCategoryEnum.Alert]: ["in_app", "email", "push"],
} as const;
