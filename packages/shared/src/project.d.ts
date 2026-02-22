/** Project/repository metadata (code stored as Git packfiles on filesystem, not in DB) */
export interface Project {
    id: string;
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    orgId?: string;
    isPrivate: boolean;
    defaultBranch: string;
    forkedFromId?: string;
    cloneCount: number;
    starCount: number;
    /** Filesystem path to the bare Git repo (packfiles) */
    storagePath: string;
    createdAt: string;
    updatedAt: string;
}
/** Pull request */
export interface PullRequest {
    id: string;
    projectId: string;
    number: number;
    title: string;
    description?: string;
    authorId: string;
    sourceBranch: string;
    targetBranch: string;
    status: "open" | "closed" | "merged";
    createdAt: string;
    updatedAt: string;
    mergedAt?: string;
    mergedBy?: string;
}
/** PR review */
export interface Review {
    id: string;
    pullRequestId: string;
    authorId: string;
    body: string;
    status: "pending" | "approved" | "changes_requested" | "commented";
    createdAt: string;
}
/** Branch protection rule */
export interface BranchProtection {
    id: string;
    projectId: string;
    pattern: string;
    requireReviews: boolean;
    minReviewers: number;
    requireStatusChecks: boolean;
    allowForcePush: boolean;
    allowDeletion: boolean;
    createdAt: string;
}
//# sourceMappingURL=project.d.ts.map