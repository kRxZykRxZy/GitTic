/**
 * Priority enums for tasks, issues, and notifications.
 * @module enums/priority
 */
/**
 * Priority levels for tasks and issues.
 */
export declare enum TaskPriority {
    /** Lowest priority; nice-to-have. */
    Lowest = "lowest",
    /** Low priority; not time-sensitive. */
    Low = "low",
    /** Normal / default priority. */
    Medium = "medium",
    /** High priority; should be addressed soon. */
    High = "high",
    /** Highest priority; needs immediate attention. */
    Highest = "highest",
    /** Critical priority; blocking or urgent. */
    Critical = "critical"
}
/**
 * Priority levels for notifications.
 */
export declare enum NotificationPriorityEnum {
    /** Low-priority informational notification. */
    Low = "low",
    /** Normal priority notification. */
    Normal = "normal",
    /** High priority notification that should stand out. */
    High = "high",
    /** Urgent notification requiring immediate attention. */
    Urgent = "urgent"
}
/**
 * Priority levels for support tickets.
 */
export declare enum SupportTicketPriority {
    /** General inquiry, no urgency. */
    Low = "low",
    /** Standard priority, response within SLA. */
    Normal = "normal",
    /** Elevated priority, faster response expected. */
    High = "high",
    /** Business-critical, immediate attention required. */
    Urgent = "urgent",
    /** System-wide outage or data loss. */
    Emergency = "emergency"
}
/**
 * Priority levels for pipeline jobs.
 */
export declare enum JobPriority {
    /** Background job, runs when resources are available. */
    Background = 0,
    /** Low priority job. */
    Low = 10,
    /** Normal priority job. */
    Normal = 50,
    /** High priority job, scheduled before normal jobs. */
    High = 80,
    /** Critical job, runs as soon as resources are available. */
    Critical = 100
}
/**
 * Numeric mapping of task priorities for sorting.
 */
export declare const TASK_PRIORITY_ORDER: Record<TaskPriority, number>;
/**
 * Display labels for task priorities.
 */
export declare const TASK_PRIORITY_LABELS: Record<TaskPriority, string>;
/**
 * Color codes for priority display in the UI.
 */
export declare const TASK_PRIORITY_COLORS: Record<TaskPriority, string>;
//# sourceMappingURL=priority.d.ts.map