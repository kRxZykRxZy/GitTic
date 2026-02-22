"use strict";
/**
 * Status enums for various platform resources.
 * @module enums/status
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvitationStatus = exports.NodeStatus = exports.UserStatus = exports.DeploymentStatusEnum = exports.PipelineStatus = exports.ResourceStatus = void 0;
/**
 * General resource lifecycle status.
 */
var ResourceStatus;
(function (ResourceStatus) {
    /** Resource is active and available. */
    ResourceStatus["Active"] = "active";
    /** Resource is inactive / disabled. */
    ResourceStatus["Inactive"] = "inactive";
    /** Resource is archived and read-only. */
    ResourceStatus["Archived"] = "archived";
    /** Resource is pending activation. */
    ResourceStatus["Pending"] = "pending";
    /** Resource has been suspended. */
    ResourceStatus["Suspended"] = "suspended";
    /** Resource has been deleted (soft delete). */
    ResourceStatus["Deleted"] = "deleted";
})(ResourceStatus || (exports.ResourceStatus = ResourceStatus = {}));
/**
 * Pipeline run status.
 */
var PipelineStatus;
(function (PipelineStatus) {
    /** Run is queued and waiting to start. */
    PipelineStatus["Queued"] = "queued";
    /** Run is currently executing. */
    PipelineStatus["Running"] = "running";
    /** Run completed successfully. */
    PipelineStatus["Success"] = "success";
    /** Run failed with an error. */
    PipelineStatus["Failure"] = "failure";
    /** Run was canceled by a user. */
    PipelineStatus["Canceled"] = "canceled";
    /** Run was skipped due to conditions not being met. */
    PipelineStatus["Skipped"] = "skipped";
    /** Run exceeded its time limit. */
    PipelineStatus["TimedOut"] = "timed_out";
    /** Run is waiting for manual approval. */
    PipelineStatus["WaitingApproval"] = "waiting_approval";
})(PipelineStatus || (exports.PipelineStatus = PipelineStatus = {}));
/**
 * Deployment status.
 */
var DeploymentStatusEnum;
(function (DeploymentStatusEnum) {
    /** Deployment is pending. */
    DeploymentStatusEnum["Pending"] = "pending";
    /** Deployment is queued for execution. */
    DeploymentStatusEnum["Queued"] = "queued";
    /** Deployment is in progress. */
    DeploymentStatusEnum["InProgress"] = "in_progress";
    /** Deployment succeeded. */
    DeploymentStatusEnum["Success"] = "success";
    /** Deployment failed. */
    DeploymentStatusEnum["Failure"] = "failure";
    /** Deployment was canceled. */
    DeploymentStatusEnum["Canceled"] = "canceled";
    /** Deployment was rolled back. */
    DeploymentStatusEnum["RolledBack"] = "rolled_back";
})(DeploymentStatusEnum || (exports.DeploymentStatusEnum = DeploymentStatusEnum = {}));
/**
 * User account status.
 */
var UserStatus;
(function (UserStatus) {
    /** Account is active and in good standing. */
    UserStatus["Active"] = "active";
    /** Account is pending email verification. */
    UserStatus["PendingVerification"] = "pending_verification";
    /** Account is suspended by an admin. */
    UserStatus["Suspended"] = "suspended";
    /** Account is locked due to security concerns. */
    UserStatus["Locked"] = "locked";
    /** Account has been deactivated by the user. */
    UserStatus["Deactivated"] = "deactivated";
    /** Account has been banned. */
    UserStatus["Banned"] = "banned";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
/**
 * Cluster node status.
 */
var NodeStatus;
(function (NodeStatus) {
    /** Node is online and ready to accept jobs. */
    NodeStatus["Ready"] = "ready";
    /** Node is online but not accepting new jobs. */
    NodeStatus["NotReady"] = "not_ready";
    /** Node is performing scheduled maintenance. */
    NodeStatus["Maintenance"] = "maintenance";
    /** Node is offline / unreachable. */
    NodeStatus["Offline"] = "offline";
    /** Node is being provisioned. */
    NodeStatus["Provisioning"] = "provisioning";
    /** Node is being drained of running jobs. */
    NodeStatus["Draining"] = "draining";
})(NodeStatus || (exports.NodeStatus = NodeStatus = {}));
/**
 * Invitation status.
 */
var InvitationStatus;
(function (InvitationStatus) {
    /** Invitation has been sent and is awaiting response. */
    InvitationStatus["Pending"] = "pending";
    /** Invitation has been accepted. */
    InvitationStatus["Accepted"] = "accepted";
    /** Invitation has been declined. */
    InvitationStatus["Declined"] = "declined";
    /** Invitation has expired. */
    InvitationStatus["Expired"] = "expired";
    /** Invitation has been revoked. */
    InvitationStatus["Revoked"] = "revoked";
})(InvitationStatus || (exports.InvitationStatus = InvitationStatus = {}));
//# sourceMappingURL=status.js.map