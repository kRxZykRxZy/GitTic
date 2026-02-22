/** CI/CD pipeline configuration */
export interface PipelineConfig {
  version: string;
  stages: PipelineStage[];
}

export interface PipelineStage {
  name: string;
  commands: string[];
  retries?: number;
  timeout?: number;
  artifacts?: string[];
  dependsOn?: string[];
}

/** Pipeline run record */
export interface PipelineRun {
  id: string;
  projectId: string;
  configHash: string;
  branch: string;
  commitSha: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  triggeredBy: string;
  stages: PipelineStageRun[];
  startedAt?: string;
  finishedAt?: string;
  createdAt: string;
}

/** Individual stage run within a pipeline */
export interface PipelineStageRun {
  id: string;
  pipelineRunId: string;
  stageName: string;
  status: "queued" | "running" | "success" | "failed" | "skipped";
  attempt: number;
  maxRetries: number;
  logUrl?: string;
  artifactUrls?: string[];
  startedAt?: string;
  finishedAt?: string;
}

/** Pipeline artifact */
export interface PipelineArtifact {
  id: string;
  pipelineRunId: string;
  stageName: string;
  fileName: string;
  filePath: string;
  sizeBytes: number;
  createdAt: string;
}
