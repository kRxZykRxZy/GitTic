/**
 * Git-related event types emitted by the version control subsystem.
 * @module events/git-events
 */
import type { BaseEvent } from "./event-types.js";
/**
 * Payload for a push event.
 */
export interface GitPushPayload {
    /** ID of the repository. */
    repositoryId: string;
    /** Full ref that was pushed (e.g., "refs/heads/main"). */
    ref: string;
    /** Short branch or tag name. */
    refName: string;
    /** SHA before the push. */
    beforeSha: string;
    /** SHA after the push. */
    afterSha: string;
    /** Whether this push created the ref. */
    created: boolean;
    /** Whether this push deleted the ref. */
    deleted: boolean;
    /** Whether this was a force push. */
    forced: boolean;
    /** Number of commits in the push. */
    commitCount: number;
    /** Summary of the commits included. */
    commits: GitCommitSummary[];
    /** Information about the pusher. */
    pusher: GitActor;
}
/**
 * A push event emitted when commits are pushed.
 */
export type GitPushEvent = BaseEvent<GitPushPayload>;
/**
 * Payload for a branch creation or deletion event.
 */
export interface GitBranchPayload {
    /** ID of the repository. */
    repositoryId: string;
    /** Branch name. */
    branchName: string;
    /** SHA the branch points to. */
    sha: string;
    /** Whether this is the default branch. */
    isDefault: boolean;
    /** Actor who performed the action. */
    actor: GitActor;
}
/**
 * A branch created event.
 */
export type GitBranchCreatedEvent = BaseEvent<GitBranchPayload>;
/**
 * A branch deleted event.
 */
export type GitBranchDeletedEvent = BaseEvent<GitBranchPayload>;
/**
 * Payload for a tag event.
 */
export interface GitTagPayload {
    /** ID of the repository. */
    repositoryId: string;
    /** Tag name. */
    tagName: string;
    /** SHA the tag points to. */
    sha: string;
    /** Tag message (for annotated tags). */
    message?: string;
    /** Actor who created or deleted the tag. */
    actor: GitActor;
}
/**
 * A tag created event.
 */
export type GitTagCreatedEvent = BaseEvent<GitTagPayload>;
/**
 * A tag deleted event.
 */
export type GitTagDeletedEvent = BaseEvent<GitTagPayload>;
/**
 * Summary of a single commit within a push.
 */
export interface GitCommitSummary {
    /** Commit SHA. */
    sha: string;
    /** Commit message. */
    message: string;
    /** Author of the commit. */
    author: GitActor;
    /** ISO-8601 timestamp of the commit. */
    timestamp: string;
    /** Number of files added. */
    added: number;
    /** Number of files modified. */
    modified: number;
    /** Number of files removed. */
    removed: number;
}
/**
 * Represents a user performing a git action.
 */
export interface GitActor {
    /** Platform user ID (if mapped). */
    userId?: string;
    /** Git author name. */
    name: string;
    /** Git author email. */
    email: string;
    /** Username on the platform. */
    username?: string;
}
//# sourceMappingURL=git-events.d.ts.map