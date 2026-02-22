/**
 * Project-related event types for project lifecycle management.
 * @module events/project-events
 */
import type { BaseEvent } from "./event-types.js";
/**
 * Payload for project creation events.
 */
export interface ProjectCreatedPayload {
    /** ID of the newly created project. */
    projectId: string;
    /** Name of the project. */
    name: string;
    /** URL slug. */
    slug: string;
    /** ID of the organization the project belongs to. */
    organizationId: string;
    /** ID of the user who created the project. */
    createdBy: string;
    /** Visibility of the project. */
    visibility: ProjectVisibility;
    /** Whether the project was created from a template. */
    fromTemplate?: string;
}
/**
 * Event emitted when a project is created.
 */
export type ProjectCreatedEvent = BaseEvent<ProjectCreatedPayload>;
/**
 * Payload for project update events.
 */
export interface ProjectUpdatedPayload {
    /** ID of the project. */
    projectId: string;
    /** Fields that were updated. */
    updatedFields: string[];
    /** ID of the user who made the update. */
    updatedBy: string;
}
/**
 * Event emitted when a project is updated.
 */
export type ProjectUpdatedEvent = BaseEvent<ProjectUpdatedPayload>;
/**
 * Payload for project deletion events.
 */
export interface ProjectDeletedPayload {
    /** ID of the deleted project. */
    projectId: string;
    /** Name of the project (captured before deletion). */
    name: string;
    /** ID of the user who deleted the project. */
    deletedBy: string;
    /** Whether the deletion is soft (recoverable) or permanent. */
    permanent: boolean;
    /** ISO-8601 timestamp when permanent deletion occurs (for soft deletes). */
    permanentDeletionAt?: string;
}
/**
 * Event emitted when a project is deleted.
 */
export type ProjectDeletedEvent = BaseEvent<ProjectDeletedPayload>;
/**
 * Payload for project transfer events.
 */
export interface ProjectTransferredPayload {
    /** ID of the project being transferred. */
    projectId: string;
    /** ID of the source organization. */
    fromOrganizationId: string;
    /** ID of the destination organization. */
    toOrganizationId: string;
    /** ID of the user who initiated the transfer. */
    initiatedBy: string;
}
/**
 * Event emitted when a project is transferred between organizations.
 */
export type ProjectTransferredEvent = BaseEvent<ProjectTransferredPayload>;
/**
 * Payload for project archival events.
 */
export interface ProjectArchivedPayload {
    /** ID of the project. */
    projectId: string;
    /** ID of the user who archived/unarchived the project. */
    actorId: string;
    /** Whether the project is now archived. */
    archived: boolean;
}
/**
 * Event emitted when a project is archived or unarchived.
 */
export type ProjectArchivedEvent = BaseEvent<ProjectArchivedPayload>;
/**
 * Visibility levels for projects.
 */
export type ProjectVisibility = "public" | "private" | "internal";
/**
 * Payload for project member events (added/removed/role changed).
 */
export interface ProjectMemberPayload {
    /** ID of the project. */
    projectId: string;
    /** ID of the affected member. */
    memberId: string;
    /** ID of the user who performed the action. */
    actorId: string;
    /** Action performed. */
    action: ProjectMemberAction;
    /** Role assigned (for added/changed actions). */
    role?: string;
    /** Previous role (for changed actions). */
    previousRole?: string;
}
/**
 * Event emitted when project membership changes.
 */
export type ProjectMemberEvent = BaseEvent<ProjectMemberPayload>;
/**
 * Actions that can be performed on project members.
 */
export type ProjectMemberAction = "added" | "removed" | "role_changed";
//# sourceMappingURL=project-events.d.ts.map