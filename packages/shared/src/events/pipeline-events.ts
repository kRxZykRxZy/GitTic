/**
 * Pipeline-related event types for CI/CD pipeline lifecycle tracking.
 * @module events/pipeline-events
 */

import type { BaseEvent } from "./event-types.js";

/**
 * Payload for pipeline run lifecycle events.
 */
export interface PipelineRunPayload {
  /** ID of the pipeline configuration. */
  pipelineId: string;
  /** ID of this specific pipeline run. */
  runId: string;
  /** Name of the pipeline. */
  pipelineName: string;
  /** ID of the project. */
  projectId: string;
  /** Git commit SHA that triggered the run. */
  commitSha: string;
  /** Git branch or tag. */
  ref: string;
  /** Trigger that started the pipeline. */
  trigger: PipelineTrigger;
  /** Current status of the run. */
  status: PipelineRunStatus;
  /** Duration in seconds (available on completion). */
  durationSeconds?: number;
  /** Error message if the run failed. */
  errorMessage?: string;
}

/**
 * Event emitted when a pipeline run starts.
 */
export type PipelineRunStartedEvent = BaseEvent<PipelineRunPayload>;

/**
 * Event emitted when a pipeline run completes successfully.
 */
export type PipelineRunCompletedEvent = BaseEvent<PipelineRunPayload>;

/**
 * Event emitted when a pipeline run fails.
 */
export type PipelineRunFailedEvent = BaseEvent<PipelineRunPayload>;

/**
 * Event emitted when a pipeline run is canceled.
 */
export type PipelineRunCanceledEvent = BaseEvent<PipelineRunPayload>;

/**
 * What triggered the pipeline.
 */
export type PipelineTrigger =
  | "push"
  | "pull_request"
  | "tag"
  | "schedule"
  | "manual"
  | "api"
  | "webhook"
  | "dependency";

/**
 * Status of a pipeline run.
 */
export type PipelineRunStatus =
  | "pending"
  | "running"
  | "success"
  | "failure"
  | "canceled"
  | "skipped"
  | "timed_out";

/**
 * Payload for pipeline stage lifecycle events.
 */
export interface PipelineStagePayload {
  /** ID of the pipeline run. */
  runId: string;
  /** ID of this specific stage run. */
  stageId: string;
  /** Name of the stage. */
  stageName: string;
  /** Index of the stage in the pipeline. */
  stageIndex: number;
  /** Status of the stage. */
  status: PipelineRunStatus;
  /** Duration in seconds. */
  durationSeconds?: number;
  /** Error message if the stage failed. */
  errorMessage?: string;
  /** Logs URL for the stage. */
  logsUrl?: string;
}

/**
 * Event emitted when a pipeline stage starts.
 */
export type PipelineStageStartedEvent = BaseEvent<PipelineStagePayload>;

/**
 * Event emitted when a pipeline stage completes.
 */
export type PipelineStageCompletedEvent = BaseEvent<PipelineStagePayload>;

/**
 * Payload for pipeline artifact events.
 */
export interface PipelineArtifactPayload {
  /** ID of the pipeline run. */
  runId: string;
  /** ID of the artifact. */
  artifactId: string;
  /** Name of the artifact. */
  name: string;
  /** Size of the artifact in bytes. */
  sizeBytes: number;
  /** MIME type of the artifact. */
  mimeType: string;
  /** Download URL. */
  downloadUrl: string;
  /** ISO-8601 expiration timestamp. */
  expiresAt: string;
}

/**
 * Event emitted when a pipeline artifact is published.
 */
export type PipelineArtifactPublishedEvent = BaseEvent<PipelineArtifactPayload>;
