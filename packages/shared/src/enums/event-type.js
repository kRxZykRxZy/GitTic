"use strict";
/**
 * Event type enums for the platform event system.
 * @module enums/event-type
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_CATEGORY_TYPES = exports.EventTypeId = exports.EventCategory = void 0;
/**
 * Top-level event categories.
 */
var EventCategory;
(function (EventCategory) {
    /** Git-related events (push, branch, tag). */
    EventCategory["Git"] = "git";
    /** Pipeline lifecycle events. */
    EventCategory["Pipeline"] = "pipeline";
    /** Deployment lifecycle events. */
    EventCategory["Deployment"] = "deployment";
    /** Project lifecycle events. */
    EventCategory["Project"] = "project";
    /** User account events. */
    EventCategory["User"] = "user";
    /** Organization events. */
    EventCategory["Organization"] = "organization";
    /** Cluster infrastructure events. */
    EventCategory["Cluster"] = "cluster";
    /** System-level events. */
    EventCategory["System"] = "system";
    /** Integration events. */
    EventCategory["Integration"] = "integration";
    /** Security events. */
    EventCategory["Security"] = "security";
})(EventCategory || (exports.EventCategory = EventCategory = {}));
/**
 * Fully qualified event type identifiers.
 */
var EventTypeId;
(function (EventTypeId) {
    /** Code was pushed to a repository. */
    EventTypeId["GitPush"] = "git.push";
    /** A branch was created. */
    EventTypeId["GitBranchCreated"] = "git.branch.created";
    /** A branch was deleted. */
    EventTypeId["GitBranchDeleted"] = "git.branch.deleted";
    /** A tag was created. */
    EventTypeId["GitTagCreated"] = "git.tag.created";
    /** A tag was deleted. */
    EventTypeId["GitTagDeleted"] = "git.tag.deleted";
    /** A pipeline run started. */
    EventTypeId["PipelineRunStarted"] = "pipeline.run.started";
    /** A pipeline run completed successfully. */
    EventTypeId["PipelineRunCompleted"] = "pipeline.run.completed";
    /** A pipeline run failed. */
    EventTypeId["PipelineRunFailed"] = "pipeline.run.failed";
    /** A pipeline run was canceled. */
    EventTypeId["PipelineRunCanceled"] = "pipeline.run.canceled";
    /** A deployment started. */
    EventTypeId["DeploymentStarted"] = "deployment.started";
    /** A deployment completed. */
    EventTypeId["DeploymentCompleted"] = "deployment.completed";
    /** A deployment failed. */
    EventTypeId["DeploymentFailed"] = "deployment.failed";
    /** A deployment was rolled back. */
    EventTypeId["DeploymentRolledBack"] = "deployment.rolled_back";
    /** A project was created. */
    EventTypeId["ProjectCreated"] = "project.created";
    /** A project was updated. */
    EventTypeId["ProjectUpdated"] = "project.updated";
    /** A project was deleted. */
    EventTypeId["ProjectDeleted"] = "project.deleted";
    /** A project was archived. */
    EventTypeId["ProjectArchived"] = "project.archived";
    /** A project was transferred. */
    EventTypeId["ProjectTransferred"] = "project.transferred";
    /** A user registered. */
    EventTypeId["UserRegistered"] = "user.registered";
    /** A user logged in. */
    EventTypeId["UserLogin"] = "user.login";
    /** A user logged out. */
    EventTypeId["UserLogout"] = "user.logout";
    /** A user profile was updated. */
    EventTypeId["UserProfileUpdated"] = "user.profile.updated";
    /** A user account was deleted. */
    EventTypeId["UserDeleted"] = "user.deleted";
    /** A cluster node was registered. */
    EventTypeId["ClusterNodeRegistered"] = "cluster.node.registered";
    /** A cluster node was deregistered. */
    EventTypeId["ClusterNodeDeregistered"] = "cluster.node.deregistered";
    /** The cluster scaled up or down. */
    EventTypeId["ClusterScaled"] = "cluster.scaled";
    /** Cluster health status changed. */
    EventTypeId["ClusterHealthChanged"] = "cluster.health.changed";
})(EventTypeId || (exports.EventTypeId = EventTypeId = {}));
/**
 * Mapping of event categories to their event types.
 */
exports.EVENT_CATEGORY_TYPES = {
    [EventCategory.Git]: [
        EventTypeId.GitPush,
        EventTypeId.GitBranchCreated,
        EventTypeId.GitBranchDeleted,
        EventTypeId.GitTagCreated,
        EventTypeId.GitTagDeleted,
    ],
    [EventCategory.Pipeline]: [
        EventTypeId.PipelineRunStarted,
        EventTypeId.PipelineRunCompleted,
        EventTypeId.PipelineRunFailed,
        EventTypeId.PipelineRunCanceled,
    ],
    [EventCategory.Deployment]: [
        EventTypeId.DeploymentStarted,
        EventTypeId.DeploymentCompleted,
        EventTypeId.DeploymentFailed,
        EventTypeId.DeploymentRolledBack,
    ],
    [EventCategory.Project]: [
        EventTypeId.ProjectCreated,
        EventTypeId.ProjectUpdated,
        EventTypeId.ProjectDeleted,
        EventTypeId.ProjectArchived,
        EventTypeId.ProjectTransferred,
    ],
    [EventCategory.User]: [
        EventTypeId.UserRegistered,
        EventTypeId.UserLogin,
        EventTypeId.UserLogout,
        EventTypeId.UserProfileUpdated,
        EventTypeId.UserDeleted,
    ],
    [EventCategory.Organization]: [],
    [EventCategory.Cluster]: [
        EventTypeId.ClusterNodeRegistered,
        EventTypeId.ClusterNodeDeregistered,
        EventTypeId.ClusterScaled,
        EventTypeId.ClusterHealthChanged,
    ],
    [EventCategory.System]: [],
    [EventCategory.Integration]: [],
    [EventCategory.Security]: [],
};
//# sourceMappingURL=event-type.js.map