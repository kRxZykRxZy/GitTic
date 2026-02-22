/**
 * Priority enums for tasks, issues, and notifications.
 * @module enums/priority
 */

/**
 * Priority levels for tasks and issues.
 */
export enum TaskPriority {
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
  Critical = "critical",
}

/**
 * Priority levels for notifications.
 */
export enum NotificationPriorityEnum {
  /** Low-priority informational notification. */
  Low = "low",
  /** Normal priority notification. */
  Normal = "normal",
  /** High priority notification that should stand out. */
  High = "high",
  /** Urgent notification requiring immediate attention. */
  Urgent = "urgent",
}

/**
 * Priority levels for support tickets.
 */
export enum SupportTicketPriority {
  /** General inquiry, no urgency. */
  Low = "low",
  /** Standard priority, response within SLA. */
  Normal = "normal",
  /** Elevated priority, faster response expected. */
  High = "high",
  /** Business-critical, immediate attention required. */
  Urgent = "urgent",
  /** System-wide outage or data loss. */
  Emergency = "emergency",
}

/**
 * Priority levels for pipeline jobs.
 */
export enum JobPriority {
  /** Background job, runs when resources are available. */
  Background = 0,
  /** Low priority job. */
  Low = 10,
  /** Normal priority job. */
  Normal = 50,
  /** High priority job, scheduled before normal jobs. */
  High = 80,
  /** Critical job, runs as soon as resources are available. */
  Critical = 100,
}

/**
 * Numeric mapping of task priorities for sorting.
 */
export const TASK_PRIORITY_ORDER: Record<TaskPriority, number> = {
  [TaskPriority.Lowest]: 0,
  [TaskPriority.Low]: 1,
  [TaskPriority.Medium]: 2,
  [TaskPriority.High]: 3,
  [TaskPriority.Highest]: 4,
  [TaskPriority.Critical]: 5,
} as const;

/**
 * Display labels for task priorities.
 */
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.Lowest]: "Lowest",
  [TaskPriority.Low]: "Low",
  [TaskPriority.Medium]: "Medium",
  [TaskPriority.High]: "High",
  [TaskPriority.Highest]: "Highest",
  [TaskPriority.Critical]: "Critical",
} as const;

/**
 * Color codes for priority display in the UI.
 */
export const TASK_PRIORITY_COLORS: Record<TaskPriority, string> = {
  [TaskPriority.Lowest]: "#6b7280",
  [TaskPriority.Low]: "#3b82f6",
  [TaskPriority.Medium]: "#f59e0b",
  [TaskPriority.High]: "#f97316",
  [TaskPriority.Highest]: "#ef4444",
  [TaskPriority.Critical]: "#dc2626",
} as const;
