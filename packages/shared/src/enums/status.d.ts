/**
 * Status enums for various platform resources.
 * @module enums/status
 */
/**
 * General resource lifecycle status.
 */
export declare enum ResourceStatus {
    /** Resource is active and available. */
    Active = "active",
    /** Resource is inactive / disabled. */
    Inactive = "inactive",
    /** Resource is archived and read-only. */
    Archived = "archived",
    /** Resource is pending activation. */
    Pending = "pending",
    /** Resource has been suspended. */
    Suspended = "suspended",
    /** Resource has been deleted (soft delete). */
    Deleted = "deleted"
}
/**
 * Pipeline run status.
 */
export declare enum PipelineStatus {
    /** Run is queued and waiting to start. */
    Queued = "queued",
    /** Run is currently executing. */
    Running = "running",
    /** Run completed successfully. */
    Success = "success",
    /** Run failed with an error. */
    Failure = "failure",
    /** Run was canceled by a user. */
    Canceled = "canceled",
    /** Run was skipped due to conditions not being met. */
    Skipped = "skipped",
    /** Run exceeded its time limit. */
    TimedOut = "timed_out",
    /** Run is waiting for manual approval. */
    WaitingApproval = "waiting_approval"
}
/**
 * Deployment status.
 */
export declare enum DeploymentStatusEnum {
    /** Deployment is pending. */
    Pending = "pending",
    /** Deployment is queued for execution. */
    Queued = "queued",
    /** Deployment is in progress. */
    InProgress = "in_progress",
    /** Deployment succeeded. */
    Success = "success",
    /** Deployment failed. */
    Failure = "failure",
    /** Deployment was canceled. */
    Canceled = "canceled",
    /** Deployment was rolled back. */
    RolledBack = "rolled_back"
}
/**
 * User account status.
 */
export declare enum UserStatus {
    /** Account is active and in good standing. */
    Active = "active",
    /** Account is pending email verification. */
    PendingVerification = "pending_verification",
    /** Account is suspended by an admin. */
    Suspended = "suspended",
    /** Account is locked due to security concerns. */
    Locked = "locked",
    /** Account has been deactivated by the user. */
    Deactivated = "deactivated",
    /** Account has been banned. */
    Banned = "banned"
}
/**
 * Cluster node status.
 */
export declare enum NodeStatus {
    /** Node is online and ready to accept jobs. */
    Ready = "ready",
    /** Node is online but not accepting new jobs. */
    NotReady = "not_ready",
    /** Node is performing scheduled maintenance. */
    Maintenance = "maintenance",
    /** Node is offline / unreachable. */
    Offline = "offline",
    /** Node is being provisioned. */
    Provisioning = "provisioning",
    /** Node is being drained of running jobs. */
    Draining = "draining"
}
/**
 * Invitation status.
 */
export declare enum InvitationStatus {
    /** Invitation has been sent and is awaiting response. */
    Pending = "pending",
    /** Invitation has been accepted. */
    Accepted = "accepted",
    /** Invitation has been declined. */
    Declined = "declined",
    /** Invitation has expired. */
    Expired = "expired",
    /** Invitation has been revoked. */
    Revoked = "revoked"
}
//# sourceMappingURL=status.d.ts.map