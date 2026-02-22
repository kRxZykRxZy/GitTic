/**
 * Event type enums for the platform event system.
 * @module enums/event-type
 */
/**
 * Top-level event categories.
 */
export declare enum EventCategory {
    /** Git-related events (push, branch, tag). */
    Git = "git",
    /** Pipeline lifecycle events. */
    Pipeline = "pipeline",
    /** Deployment lifecycle events. */
    Deployment = "deployment",
    /** Project lifecycle events. */
    Project = "project",
    /** User account events. */
    User = "user",
    /** Organization events. */
    Organization = "organization",
    /** Cluster infrastructure events. */
    Cluster = "cluster",
    /** System-level events. */
    System = "system",
    /** Integration events. */
    Integration = "integration",
    /** Security events. */
    Security = "security"
}
/**
 * Fully qualified event type identifiers.
 */
export declare enum EventTypeId {
    /** Code was pushed to a repository. */
    GitPush = "git.push",
    /** A branch was created. */
    GitBranchCreated = "git.branch.created",
    /** A branch was deleted. */
    GitBranchDeleted = "git.branch.deleted",
    /** A tag was created. */
    GitTagCreated = "git.tag.created",
    /** A tag was deleted. */
    GitTagDeleted = "git.tag.deleted",
    /** A pipeline run started. */
    PipelineRunStarted = "pipeline.run.started",
    /** A pipeline run completed successfully. */
    PipelineRunCompleted = "pipeline.run.completed",
    /** A pipeline run failed. */
    PipelineRunFailed = "pipeline.run.failed",
    /** A pipeline run was canceled. */
    PipelineRunCanceled = "pipeline.run.canceled",
    /** A deployment started. */
    DeploymentStarted = "deployment.started",
    /** A deployment completed. */
    DeploymentCompleted = "deployment.completed",
    /** A deployment failed. */
    DeploymentFailed = "deployment.failed",
    /** A deployment was rolled back. */
    DeploymentRolledBack = "deployment.rolled_back",
    /** A project was created. */
    ProjectCreated = "project.created",
    /** A project was updated. */
    ProjectUpdated = "project.updated",
    /** A project was deleted. */
    ProjectDeleted = "project.deleted",
    /** A project was archived. */
    ProjectArchived = "project.archived",
    /** A project was transferred. */
    ProjectTransferred = "project.transferred",
    /** A user registered. */
    UserRegistered = "user.registered",
    /** A user logged in. */
    UserLogin = "user.login",
    /** A user logged out. */
    UserLogout = "user.logout",
    /** A user profile was updated. */
    UserProfileUpdated = "user.profile.updated",
    /** A user account was deleted. */
    UserDeleted = "user.deleted",
    /** A cluster node was registered. */
    ClusterNodeRegistered = "cluster.node.registered",
    /** A cluster node was deregistered. */
    ClusterNodeDeregistered = "cluster.node.deregistered",
    /** The cluster scaled up or down. */
    ClusterScaled = "cluster.scaled",
    /** Cluster health status changed. */
    ClusterHealthChanged = "cluster.health.changed"
}
/**
 * Mapping of event categories to their event types.
 */
export declare const EVENT_CATEGORY_TYPES: Record<EventCategory, EventTypeId[]>;
//# sourceMappingURL=event-type.d.ts.map