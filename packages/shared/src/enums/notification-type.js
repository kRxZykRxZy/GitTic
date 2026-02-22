"use strict";
/**
 * Notification type enums for the notification system.
 * @module enums/notification-type
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_NOTIFICATION_CHANNELS = exports.NOTIFICATION_CATEGORY_ICONS = exports.NOTIFICATION_CATEGORY_LABELS = exports.NotificationTypeId = exports.NotificationCategoryEnum = void 0;
/**
 * Categories of notifications.
 */
var NotificationCategoryEnum;
(function (NotificationCategoryEnum) {
    /** System-wide announcements and updates. */
    NotificationCategoryEnum["System"] = "system";
    /** Security-related notifications (login, password change). */
    NotificationCategoryEnum["Security"] = "security";
    /** Project activity notifications. */
    NotificationCategoryEnum["Project"] = "project";
    /** Pipeline status notifications. */
    NotificationCategoryEnum["Pipeline"] = "pipeline";
    /** Deployment status notifications. */
    NotificationCategoryEnum["Deployment"] = "deployment";
    /** Collaboration notifications (comments, reviews). */
    NotificationCategoryEnum["Collaboration"] = "collaboration";
    /** Billing and subscription notifications. */
    NotificationCategoryEnum["Billing"] = "billing";
    /** Mentions in comments or discussions. */
    NotificationCategoryEnum["Mention"] = "mention";
    /** Code review notifications. */
    NotificationCategoryEnum["Review"] = "review";
    /** Alert notifications from monitoring. */
    NotificationCategoryEnum["Alert"] = "alert";
})(NotificationCategoryEnum || (exports.NotificationCategoryEnum = NotificationCategoryEnum = {}));
/**
 * Specific notification type identifiers.
 */
var NotificationTypeId;
(function (NotificationTypeId) {
    /** New comment on a pull request. */
    NotificationTypeId["PrComment"] = "pr.comment";
    /** Pull request review requested. */
    NotificationTypeId["PrReviewRequested"] = "pr.review_requested";
    /** Pull request approved. */
    NotificationTypeId["PrApproved"] = "pr.approved";
    /** Pull request changes requested. */
    NotificationTypeId["PrChangesRequested"] = "pr.changes_requested";
    /** Pull request merged. */
    NotificationTypeId["PrMerged"] = "pr.merged";
    /** Pipeline run succeeded. */
    NotificationTypeId["PipelineSuccess"] = "pipeline.success";
    /** Pipeline run failed. */
    NotificationTypeId["PipelineFailure"] = "pipeline.failure";
    /** Deployment succeeded. */
    NotificationTypeId["DeploymentSuccess"] = "deployment.success";
    /** Deployment failed. */
    NotificationTypeId["DeploymentFailure"] = "deployment.failure";
    /** User was mentioned in a comment. */
    NotificationTypeId["Mentioned"] = "mentioned";
    /** User was assigned to an issue. */
    NotificationTypeId["Assigned"] = "assigned";
    /** Team membership invitation. */
    NotificationTypeId["TeamInvitation"] = "team.invitation";
    /** Security alert (suspicious login). */
    NotificationTypeId["SecurityAlert"] = "security.alert";
    /** Password was changed. */
    NotificationTypeId["PasswordChanged"] = "security.password_changed";
    /** Billing payment succeeded. */
    NotificationTypeId["PaymentSucceeded"] = "billing.payment_succeeded";
    /** Billing payment failed. */
    NotificationTypeId["PaymentFailed"] = "billing.payment_failed";
    /** Subscription expiring soon. */
    NotificationTypeId["SubscriptionExpiring"] = "billing.subscription_expiring";
    /** Usage quota warning. */
    NotificationTypeId["QuotaWarning"] = "billing.quota_warning";
    /** System maintenance scheduled. */
    NotificationTypeId["MaintenanceScheduled"] = "system.maintenance_scheduled";
    /** New platform feature announcement. */
    NotificationTypeId["FeatureAnnouncement"] = "system.feature_announcement";
})(NotificationTypeId || (exports.NotificationTypeId = NotificationTypeId = {}));
/**
 * Display labels for notification categories.
 */
exports.NOTIFICATION_CATEGORY_LABELS = {
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
};
/**
 * Icons for notification categories.
 */
exports.NOTIFICATION_CATEGORY_ICONS = {
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
};
/**
 * Default enabled channels per notification category.
 */
exports.DEFAULT_NOTIFICATION_CHANNELS = {
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
};
//# sourceMappingURL=notification-type.js.map