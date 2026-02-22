"use strict";
/**
 * Priority enums for tasks, issues, and notifications.
 * @module enums/priority
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TASK_PRIORITY_COLORS = exports.TASK_PRIORITY_LABELS = exports.TASK_PRIORITY_ORDER = exports.JobPriority = exports.SupportTicketPriority = exports.NotificationPriorityEnum = exports.TaskPriority = void 0;
/**
 * Priority levels for tasks and issues.
 */
var TaskPriority;
(function (TaskPriority) {
    /** Lowest priority; nice-to-have. */
    TaskPriority["Lowest"] = "lowest";
    /** Low priority; not time-sensitive. */
    TaskPriority["Low"] = "low";
    /** Normal / default priority. */
    TaskPriority["Medium"] = "medium";
    /** High priority; should be addressed soon. */
    TaskPriority["High"] = "high";
    /** Highest priority; needs immediate attention. */
    TaskPriority["Highest"] = "highest";
    /** Critical priority; blocking or urgent. */
    TaskPriority["Critical"] = "critical";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
/**
 * Priority levels for notifications.
 */
var NotificationPriorityEnum;
(function (NotificationPriorityEnum) {
    /** Low-priority informational notification. */
    NotificationPriorityEnum["Low"] = "low";
    /** Normal priority notification. */
    NotificationPriorityEnum["Normal"] = "normal";
    /** High priority notification that should stand out. */
    NotificationPriorityEnum["High"] = "high";
    /** Urgent notification requiring immediate attention. */
    NotificationPriorityEnum["Urgent"] = "urgent";
})(NotificationPriorityEnum || (exports.NotificationPriorityEnum = NotificationPriorityEnum = {}));
/**
 * Priority levels for support tickets.
 */
var SupportTicketPriority;
(function (SupportTicketPriority) {
    /** General inquiry, no urgency. */
    SupportTicketPriority["Low"] = "low";
    /** Standard priority, response within SLA. */
    SupportTicketPriority["Normal"] = "normal";
    /** Elevated priority, faster response expected. */
    SupportTicketPriority["High"] = "high";
    /** Business-critical, immediate attention required. */
    SupportTicketPriority["Urgent"] = "urgent";
    /** System-wide outage or data loss. */
    SupportTicketPriority["Emergency"] = "emergency";
})(SupportTicketPriority || (exports.SupportTicketPriority = SupportTicketPriority = {}));
/**
 * Priority levels for pipeline jobs.
 */
var JobPriority;
(function (JobPriority) {
    /** Background job, runs when resources are available. */
    JobPriority[JobPriority["Background"] = 0] = "Background";
    /** Low priority job. */
    JobPriority[JobPriority["Low"] = 10] = "Low";
    /** Normal priority job. */
    JobPriority[JobPriority["Normal"] = 50] = "Normal";
    /** High priority job, scheduled before normal jobs. */
    JobPriority[JobPriority["High"] = 80] = "High";
    /** Critical job, runs as soon as resources are available. */
    JobPriority[JobPriority["Critical"] = 100] = "Critical";
})(JobPriority || (exports.JobPriority = JobPriority = {}));
/**
 * Numeric mapping of task priorities for sorting.
 */
exports.TASK_PRIORITY_ORDER = {
    [TaskPriority.Lowest]: 0,
    [TaskPriority.Low]: 1,
    [TaskPriority.Medium]: 2,
    [TaskPriority.High]: 3,
    [TaskPriority.Highest]: 4,
    [TaskPriority.Critical]: 5,
};
/**
 * Display labels for task priorities.
 */
exports.TASK_PRIORITY_LABELS = {
    [TaskPriority.Lowest]: "Lowest",
    [TaskPriority.Low]: "Low",
    [TaskPriority.Medium]: "Medium",
    [TaskPriority.High]: "High",
    [TaskPriority.Highest]: "Highest",
    [TaskPriority.Critical]: "Critical",
};
/**
 * Color codes for priority display in the UI.
 */
exports.TASK_PRIORITY_COLORS = {
    [TaskPriority.Lowest]: "#6b7280",
    [TaskPriority.Low]: "#3b82f6",
    [TaskPriority.Medium]: "#f59e0b",
    [TaskPriority.High]: "#f97316",
    [TaskPriority.Highest]: "#ef4444",
    [TaskPriority.Critical]: "#dc2626",
};
//# sourceMappingURL=priority.js.map