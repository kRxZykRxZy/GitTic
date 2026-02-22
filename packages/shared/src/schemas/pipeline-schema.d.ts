/**
 * Pipeline schema types for validation and API contracts.
 * @module schemas/pipeline-schema
 */
/**
 * Schema for creating a new pipeline configuration.
 */
export interface CreatePipelineSchema {
    /** Pipeline name. */
    name: string;
    /** ID of the project this pipeline belongs to. */
    projectId: string;
    /** Description of the pipeline. */
    description?: string;
    /** Trigger configuration. */
    trigger: PipelineTriggerSchema;
    /** Ordered list of stages. */
    stages: PipelineStageSchema[];
    /** Environment variables available to all stages. */
    variables?: Record<string, string>;
    /** Timeout in minutes for the entire pipeline. */
    timeoutMinutes?: number;
    /** Whether the pipeline is enabled. */
    enabled?: boolean;
}
/**
 * Schema for updating a pipeline configuration.
 */
export interface UpdatePipelineSchema {
    /** Updated name. */
    name?: string;
    /** Updated description. */
    description?: string;
    /** Updated trigger configuration. */
    trigger?: PipelineTriggerSchema;
    /** Updated stages. */
    stages?: PipelineStageSchema[];
    /** Updated variables. */
    variables?: Record<string, string>;
    /** Updated timeout. */
    timeoutMinutes?: number;
    /** Updated enabled status. */
    enabled?: boolean;
}
/**
 * Trigger configuration determining when a pipeline runs.
 */
export interface PipelineTriggerSchema {
    /** Events that trigger the pipeline. */
    events: PipelineTriggerEvent[];
    /** Branch patterns that trigger the pipeline (glob syntax). */
    branches?: string[];
    /** Tag patterns that trigger the pipeline. */
    tags?: string[];
    /** File path patterns that trigger the pipeline. */
    paths?: string[];
    /** File path patterns to exclude from triggering. */
    pathsExclude?: string[];
    /** Cron schedule (for scheduled pipelines). */
    schedule?: string;
}
/**
 * Events that can trigger a pipeline.
 */
export type PipelineTriggerEvent = "push" | "pull_request" | "tag" | "schedule" | "manual" | "workflow_dispatch";
/**
 * Schema for a single pipeline stage.
 */
export interface PipelineStageSchema {
    /** Stage name. */
    name: string;
    /** Container image to run the stage in. */
    image: string;
    /** Commands to execute. */
    commands: string[];
    /** Services required by this stage (e.g., databases). */
    services?: PipelineServiceSchema[];
    /** Artifacts to collect after the stage completes. */
    artifacts?: PipelineArtifactSchema[];
    /** Cache configuration. */
    cache?: PipelineCacheSchema;
    /** Conditions under which this stage runs. */
    condition?: StageCondition;
    /** Timeout in minutes for this stage. */
    timeoutMinutes?: number;
    /** Number of retry attempts on failure. */
    retries?: number;
    /** Environment variables specific to this stage. */
    variables?: Record<string, string>;
}
/**
 * Schema for a service container used during a stage.
 */
export interface PipelineServiceSchema {
    /** Service name (used as hostname). */
    name: string;
    /** Container image for the service. */
    image: string;
    /** Environment variables for the service. */
    variables?: Record<string, string>;
}
/**
 * Schema for pipeline artifacts.
 */
export interface PipelineArtifactSchema {
    /** Artifact name. */
    name: string;
    /** File path patterns to include. */
    paths: string[];
    /** Retention period in days. */
    retentionDays?: number;
}
/**
 * Schema for pipeline cache configuration.
 */
export interface PipelineCacheSchema {
    /** Cache key template. */
    key: string;
    /** Paths to cache. */
    paths: string[];
    /** Fallback keys if the primary key misses. */
    fallbackKeys?: string[];
}
/**
 * Conditions under which a stage executes.
 */
export type StageCondition = "always" | "on_success" | "on_failure" | "manual" | "never";
//# sourceMappingURL=pipeline-schema.d.ts.map