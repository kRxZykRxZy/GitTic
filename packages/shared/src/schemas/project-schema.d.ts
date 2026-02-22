/**
 * Project schema types for validation and API contracts.
 * @module schemas/project-schema
 */
/**
 * Schema for creating a new project.
 */
export interface CreateProjectSchema {
    /** Project name (1-100 characters). */
    name: string;
    /** URL-friendly slug (auto-generated if not provided). */
    slug?: string;
    /** Description of the project. */
    description?: string;
    /** Visibility level. */
    visibility: ProjectVisibilitySchema;
    /** ID of the organization the project belongs to. */
    organizationId: string;
    /** ID of a template to initialize from. */
    templateId?: string;
    /** Default branch name. */
    defaultBranch?: string;
    /** Initial tags for the project. */
    tags?: string[];
}
/**
 * Schema for updating an existing project.
 */
export interface UpdateProjectSchema {
    /** Updated name. */
    name?: string;
    /** Updated description. */
    description?: string;
    /** Updated visibility. */
    visibility?: ProjectVisibilitySchema;
    /** Updated default branch. */
    defaultBranch?: string;
    /** Updated tags. */
    tags?: string[];
    /** Whether the project is archived. */
    archived?: boolean;
}
/**
 * Visibility levels for projects.
 */
export type ProjectVisibilitySchema = "public" | "private" | "internal";
/**
 * Schema for transferring a project to another organization.
 */
export interface TransferProjectSchema {
    /** ID of the destination organization. */
    targetOrganizationId: string;
    /** New name for the project (if renaming during transfer). */
    newName?: string;
}
/**
 * Schema for forking a project.
 */
export interface ForkProjectSchema {
    /** ID of the destination organization. */
    targetOrganizationId: string;
    /** Name for the forked project. */
    name?: string;
    /** Whether to fork all branches or only the default. */
    allBranches?: boolean;
}
/**
 * Schema for project settings configuration.
 */
export interface ProjectSettingsSchema {
    /** Whether issues are enabled. */
    issuesEnabled: boolean;
    /** Whether the wiki is enabled. */
    wikiEnabled: boolean;
    /** Whether discussions are enabled. */
    discussionsEnabled: boolean;
    /** Whether pull requests require approval. */
    requirePrApproval: boolean;
    /** Minimum number of approvals required for merging. */
    minApprovals: number;
    /** Whether to automatically delete head branches after merge. */
    autoDeleteBranches: boolean;
    /** Allowed merge strategies. */
    mergeStrategies: MergeStrategy[];
    /** Default merge strategy. */
    defaultMergeStrategy: MergeStrategy;
}
/**
 * Git merge strategies.
 */
export type MergeStrategy = "merge" | "squash" | "rebase" | "fast_forward";
/**
 * Schema for searching projects.
 */
export interface ProjectSearchSchema {
    /** Search query string. */
    query?: string;
    /** Filter by visibility. */
    visibility?: ProjectVisibilitySchema;
    /** Filter by organization ID. */
    organizationId?: string;
    /** Filter by tag. */
    tags?: string[];
    /** Filter by archived status. */
    archived?: boolean;
    /** Sort field. */
    sortBy?: ProjectSortField;
    /** Sort direction. */
    sortDirection?: "asc" | "desc";
    /** Page number. */
    page?: number;
    /** Items per page. */
    perPage?: number;
}
/**
 * Fields by which projects can be sorted.
 */
export type ProjectSortField = "name" | "createdAt" | "updatedAt" | "stars" | "forks";
//# sourceMappingURL=project-schema.d.ts.map