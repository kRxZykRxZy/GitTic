import { randomUUID } from "node:crypto";
import type { PipelineRun, PipelineStageRun } from "@platform/shared";
import { getDb } from "../connection.js";

/* ── Row types ─────────────────────────────────────────────── */

interface RunRow {
  id: string;
  project_id: string;
  config_hash: string;
  branch: string;
  commit_sha: string;
  status: string;
  triggered_by: string;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

interface StageRow {
  id: string;
  pipeline_run_id: string;
  stage_name: string;
  status: string;
  attempt: number;
  max_retries: number;
  log_url: string | null;
  artifact_urls: string | null;
  started_at: string | null;
  finished_at: string | null;
}

/* ── Mappers ───────────────────────────────────────────────── */

function toStageRun(r: StageRow): PipelineStageRun {
  return {
    id: r.id,
    pipelineRunId: r.pipeline_run_id,
    stageName: r.stage_name,
    status: r.status as PipelineStageRun["status"],
    attempt: r.attempt,
    maxRetries: r.max_retries,
    logUrl: r.log_url ?? undefined,
    artifactUrls: r.artifact_urls ? (JSON.parse(r.artifact_urls) as string[]) : undefined,
    startedAt: r.started_at ?? undefined,
    finishedAt: r.finished_at ?? undefined,
  };
}

function toRun(r: RunRow, stages: PipelineStageRun[]): PipelineRun {
  return {
    id: r.id,
    projectId: r.project_id,
    configHash: r.config_hash,
    branch: r.branch,
    commitSha: r.commit_sha,
    status: r.status as PipelineRun["status"],
    triggeredBy: r.triggered_by,
    stages,
    startedAt: r.started_at ?? undefined,
    finishedAt: r.finished_at ?? undefined,
    createdAt: r.created_at,
  };
}

/** Load stages for a given pipeline run. */
function loadStages(runId: string): PipelineStageRun[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM pipeline_stages WHERE pipeline_run_id = ? ORDER BY rowid")
    .all(runId) as StageRow[];
  return rows.map(toStageRun);
}

/* ── Input types ───────────────────────────────────────────── */

/** Input for creating a pipeline run. */
export interface CreateRunInput {
  projectId: string;
  configHash: string;
  branch: string;
  commitSha: string;
  triggeredBy: string;
}

/** Input for creating a stage run within a pipeline. */
export interface CreateStageInput {
  pipelineRunId: string;
  stageName: string;
  maxRetries?: number;
}

/** Input for updating a stage run. */
export interface UpdateStageInput {
  status?: PipelineStageRun["status"];
  attempt?: number;
  logUrl?: string;
  artifactUrls?: string[];
  startedAt?: string;
  finishedAt?: string;
}

/** Pagination options. */
export interface PaginationOpts {
  page: number;
  perPage: number;
}

/* ── Pipeline run operations ───────────────────────────────── */

/**
 * Create a new pipeline run record.
 */
export function createRun(input: CreateRunInput): PipelineRun {
  const db = getDb();
  const id = randomUUID();
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO pipeline_runs (id, project_id, config_hash, branch, commit_sha, status, triggered_by, created_at)
     VALUES (?, ?, ?, ?, ?, 'queued', ?, ?)`,
  ).run(id, input.projectId, input.configHash, input.branch, input.commitSha, input.triggeredBy, now);

  return findRunById(id)!;
}

/**
 * Find a pipeline run by ID, including its stages.
 */
export function findRunById(id: string): PipelineRun | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM pipeline_runs WHERE id = ?")
    .get(id) as RunRow | undefined;
  if (!row) return null;
  return toRun(row, loadStages(id));
}

/**
 * Update the status and optional timestamps of a pipeline run.
 */
export function updateRunStatus(
  id: string,
  status: PipelineRun["status"],
  timestamps?: { startedAt?: string; finishedAt?: string },
): boolean {
  const db = getDb();
  const sets = ["status = ?"];
  const values: unknown[] = [status];

  if (timestamps?.startedAt) { sets.push("started_at = ?"); values.push(timestamps.startedAt); }
  if (timestamps?.finishedAt) { sets.push("finished_at = ?"); values.push(timestamps.finishedAt); }

  values.push(id);
  const result = db.prepare(`UPDATE pipeline_runs SET ${sets.join(", ")} WHERE id = ?`).run(...values);
  return result.changes > 0;
}

/**
 * List pipeline runs with pagination, most recent first.
 */
export function listRuns(opts: PaginationOpts): PipelineRun[] {
  const db = getDb();
  const offset = (opts.page - 1) * opts.perPage;
  const rows = db
    .prepare("SELECT * FROM pipeline_runs ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(opts.perPage, offset) as RunRow[];
  return rows.map((r) => toRun(r, loadStages(r.id)));
}

/* ── Stage run operations ──────────────────────────────────── */

/**
 * Create a new stage run within a pipeline.
 */
export function createStageRun(input: CreateStageInput): PipelineStageRun {
  const db = getDb();
  const id = randomUUID();

  db.prepare(
    `INSERT INTO pipeline_stages (id, pipeline_run_id, stage_name, status, attempt, max_retries)
     VALUES (?, ?, ?, 'queued', 1, ?)`,
  ).run(id, input.pipelineRunId, input.stageName, input.maxRetries ?? 0);

  const row = db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as StageRow;
  return toStageRun(row);
}

/**
 * Update fields of an existing stage run.
 */
export function updateStageRun(id: string, input: UpdateStageInput): PipelineStageRun | null {
  const db = getDb();
  const sets: string[] = [];
  const values: unknown[] = [];

  if (input.status !== undefined) { sets.push("status = ?"); values.push(input.status); }
  if (input.attempt !== undefined) { sets.push("attempt = ?"); values.push(input.attempt); }
  if (input.logUrl !== undefined) { sets.push("log_url = ?"); values.push(input.logUrl); }
  if (input.artifactUrls !== undefined) { sets.push("artifact_urls = ?"); values.push(JSON.stringify(input.artifactUrls)); }
  if (input.startedAt !== undefined) { sets.push("started_at = ?"); values.push(input.startedAt); }
  if (input.finishedAt !== undefined) { sets.push("finished_at = ?"); values.push(input.finishedAt); }

  if (sets.length === 0) {
    const row = db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as StageRow | undefined;
    return row ? toStageRun(row) : null;
  }

  values.push(id);
  db.prepare(`UPDATE pipeline_stages SET ${sets.join(", ")} WHERE id = ?`).run(...values);

  const row = db.prepare("SELECT * FROM pipeline_stages WHERE id = ?").get(id) as StageRow | undefined;
  return row ? toStageRun(row) : null;
}

/**
 * Get all pipeline runs for a specific project.
 */
export function getRunsByProject(projectId: string, opts: PaginationOpts): PipelineRun[] {
  const db = getDb();
  const offset = (opts.page - 1) * opts.perPage;
  const rows = db
    .prepare("SELECT * FROM pipeline_runs WHERE project_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?")
    .all(projectId, opts.perPage, offset) as RunRow[];
  return rows.map((r) => toRun(r, loadStages(r.id)));
}
