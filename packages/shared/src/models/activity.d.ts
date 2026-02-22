/**
 * Activity feed and audit trail types.
 * @module models/activity
 */
/**
 * Represents a single activity event in the platform feed.
 */
export interface Activity {
    /** Unique identifier for the activity entry. */
    id: string;
    /** Type of activity that occurred. */
    type: ActivityType;
    /** ID of the user who performed the action (null for system actions). */
    actorId: string | null;
    /** Display name of the actor at the time of the event. */
    actorName: string;
    /** The type of resource that was affected. */
    resourceType: ActivityResourceType;
    /** ID of the affected resource. */
    resourceId: string;
    /** Human-readable name / title of the affected resource. */
    resourceName: string;
    /** ID of the organization this activity belongs to. */
    organizationId: string;
    /** ID of the project (if applicable). */
    projectId?: string;
    /** Human-readable summary of the activity. */
    summary: string;
    /** Detailed description or diff of changes. */
    details?: ActivityDetails;
    /** IP address from which the action was performed. */
    ipAddress?: string;
    /** User agent string of the client. */
    userAgent?: string;
    /** ISO-8601 timestamp of when the activity occurred. */
    createdAt: string;
}
/**
 * Categories of activity events.
 */
export type ActivityType = "created" | "updated" | "deleted" | "archived" | "restored" | "commented" | "assigned" | "unassigned" | "merged" | "deployed" | "approved" | "rejected" | "invited" | "joined" | "left" | "transferred";
/**
 * Resource types that can generate activity events.
 */
export type ActivityResourceType = "user" | "project" | "pipeline" | "deployment" | "environment" | "cluster" | "webhook" | "integration" | "organization" | "team" | "secret" | "variable";
/**
 * Detailed information about changes made during an activity.
 */
export interface ActivityDetails {
    /** List of individual field changes. */
    changes?: FieldChange[];
    /** Free-form context specific to the activity type. */
    context?: Record<string, unknown>;
}
/**
 * Describes a single field change within an activity.
 */
export interface FieldChange {
    /** Name of the field that changed. */
    field: string;
    /** Previous value (null if newly created). */
    oldValue: unknown;
    /** New value (null if deleted). */
    newValue: unknown;
}
/**
 * Filter parameters for querying the activity feed.
 */
export interface ActivityFilter {
    /** Filter by activity types. */
    types?: ActivityType[];
    /** Filter by resource types. */
    resourceTypes?: ActivityResourceType[];
    /** Filter by actor user ID. */
    actorId?: string;
    /** Filter by project ID. */
    projectId?: string;
    /** Filter by organization ID. */
    organizationId?: string;
    /** Start of the date range (ISO-8601). */
    from?: string;
    /** End of the date range (ISO-8601). */
    to?: string;
}
//# sourceMappingURL=activity.d.ts.map