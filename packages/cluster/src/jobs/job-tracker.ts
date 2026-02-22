/**
 * Job tracking system for monitoring job status, progress,
 * duration, resource usage, and history.
 * @module
 */

import { EventEmitter } from "node:events";

/** Job status in the tracker */
export type TrackedJobStatus =
  | "pending"
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "timed-out";

/** Resource usage for a tracked job */
export interface JobResourceUsage {
  /** CPU time in milliseconds */
  cpuTimeMs: number;
  /** Peak memory in bytes */
  peakMemoryBytes: number;
  /** Output size in bytes */
  outputSizeBytes: number;
}

/** Full tracked job entry */
export interface TrackedJob {
  /** Job identifier */
  jobId: string;
  /** Job type/name */
  type: string;
  /** Current status */
  status: TrackedJobStatus;
  /** Progress percentage (0-100) */
  progress: number;
  /** Node ID where the job is running */
  nodeId: string | null;
  /** When the job was created */
  createdAt: number;
  /** When the job started running */
  startedAt: number | null;
  /** When the job completed */
  completedAt: number | null;
  /** Duration in milliseconds (computed) */
  durationMs: number | null;
  /** Resource usage stats */
  resourceUsage: JobResourceUsage;
  /** Output or error message */
  output: string | null;
  /** Exit code if applicable */
  exitCode: number | null;
  /** User who submitted the job */
  userId: string | null;
  /** Metadata */
  metadata: Record<string, unknown>;
}

/** Notification emitted for job events */
export interface JobNotification {
  /** Job identifier */
  jobId: string;
  /** Event type */
  event: "started" | "completed" | "failed" | "progress" | "cancelled";
  /** Timestamp */
  timestamp: number;
  /** Description */
  message: string;
}

/**
 * Tracks job lifecycle, progress, and resource usage.
 * Provides job history and emits notifications on state changes.
 */
export class JobTracker extends EventEmitter {
  private readonly jobs = new Map<string, TrackedJob>();
  private readonly maxHistory: number;
  private readonly completedJobs: TrackedJob[] = [];

  /**
   * @param maxHistory - Maximum completed jobs to retain (default: 10000)
   */
  constructor(maxHistory: number = 10_000) {
    super();
    this.maxHistory = maxHistory;
  }

  /**
   * Start tracking a new job.
   * @param jobId - Unique job identifier
   * @param type - Job type/name
   * @param userId - Optional submitting user
   * @param metadata - Optional metadata
   * @returns The tracked job entry
   */
  track(
    jobId: string,
    type: string,
    userId?: string,
    metadata?: Record<string, unknown>
  ): TrackedJob {
    const job: TrackedJob = {
      jobId,
      type,
      status: "pending",
      progress: 0,
      nodeId: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      durationMs: null,
      resourceUsage: {
        cpuTimeMs: 0,
        peakMemoryBytes: 0,
        outputSizeBytes: 0,
      },
      output: null,
      exitCode: null,
      userId: userId ?? null,
      metadata: metadata ?? {},
    };

    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Mark a job as started on a specific node.
   * @param jobId - Job identifier
   * @param nodeId - Node where the job is running
   */
  markStarted(jobId: string, nodeId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.status = "running";
    job.startedAt = Date.now();
    job.nodeId = nodeId;

    this.emitNotification(jobId, "started", `Job ${jobId} started on node ${nodeId}`);
    return true;
  }

  /**
   * Update job progress.
   * @param jobId - Job identifier
   * @param progress - Progress percentage (0-100)
   */
  updateProgress(jobId: string, progress: number): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.progress = Math.min(100, Math.max(0, progress));
    this.emitNotification(jobId, "progress", `Job ${jobId} progress: ${job.progress}%`);
    return true;
  }

  /**
   * Mark a job as successfully completed.
   * @param jobId - Job identifier
   * @param output - Job output
   * @param resourceUsage - Optional resource usage stats
   */
  markCompleted(
    jobId: string,
    output?: string,
    resourceUsage?: Partial<JobResourceUsage>
  ): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const now = Date.now();
    job.status = "success";
    job.progress = 100;
    job.completedAt = now;
    job.durationMs = job.startedAt ? now - job.startedAt : null;
    job.exitCode = 0;
    job.output = output ?? null;

    if (resourceUsage) {
      Object.assign(job.resourceUsage, resourceUsage);
    }
    if (output) {
      job.resourceUsage.outputSizeBytes = Buffer.byteLength(output, "utf-8");
    }

    this.archiveJob(job);
    this.emitNotification(jobId, "completed", `Job ${jobId} completed successfully`);
    return true;
  }

  /**
   * Mark a job as failed.
   * @param jobId - Job identifier
   * @param error - Error message
   * @param exitCode - Process exit code
   */
  markFailed(jobId: string, error: string, exitCode: number = 1): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    const now = Date.now();
    job.status = "failed";
    job.completedAt = now;
    job.durationMs = job.startedAt ? now - job.startedAt : null;
    job.exitCode = exitCode;
    job.output = error;

    this.archiveJob(job);
    this.emitNotification(jobId, "failed", `Job ${jobId} failed: ${error}`);
    return true;
  }

  /**
   * Mark a job as cancelled.
   * @param jobId - Job identifier
   */
  markCancelled(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;

    job.status = "cancelled";
    job.completedAt = Date.now();
    job.durationMs = job.startedAt ? Date.now() - job.startedAt : null;

    this.archiveJob(job);
    this.emitNotification(jobId, "cancelled", `Job ${jobId} was cancelled`);
    return true;
  }

  /**
   * Get a tracked job by ID.
   * @param jobId - Job identifier
   */
  getJob(jobId: string): TrackedJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all active (non-completed) jobs.
   */
  getActiveJobs(): TrackedJob[] {
    return Array.from(this.jobs.values()).filter(
      (j) => j.status === "pending" || j.status === "queued" || j.status === "running"
    );
  }

  /**
   * Get completed job history.
   * @param limit - Maximum entries to return
   */
  getHistory(limit?: number): TrackedJob[] {
    if (limit && limit < this.completedJobs.length) {
      return this.completedJobs.slice(-limit);
    }
    return [...this.completedJobs];
  }

  /**
   * Get jobs filtered by user.
   * @param userId - User identifier
   */
  getJobsByUser(userId: string): TrackedJob[] {
    const active = Array.from(this.jobs.values()).filter((j) => j.userId === userId);
    const completed = this.completedJobs.filter((j) => j.userId === userId);
    return [...active, ...completed];
  }

  /**
   * Get job statistics.
   */
  getStats(): {
    activeJobs: number;
    completedJobs: number;
    failedJobs: number;
    avgDurationMs: number;
  } {
    const completed = this.completedJobs.filter((j) => j.status === "success");
    const failed = this.completedJobs.filter((j) => j.status === "failed");

    const totalDuration = completed.reduce((sum, j) => sum + (j.durationMs ?? 0), 0);
    const avgDuration = completed.length > 0 ? Math.round(totalDuration / completed.length) : 0;

    return {
      activeJobs: this.jobs.size,
      completedJobs: completed.length,
      failedJobs: failed.length,
      avgDurationMs: avgDuration,
    };
  }

  /**
   * Archive a completed job to history and remove from active tracking.
   */
  private archiveJob(job: TrackedJob): void {
    this.completedJobs.push({ ...job });
    this.jobs.delete(job.jobId);

    if (this.completedJobs.length > this.maxHistory) {
      this.completedJobs.splice(0, this.completedJobs.length - this.maxHistory);
    }
  }

  /**
   * Emit a job notification event.
   */
  private emitNotification(
    jobId: string,
    event: JobNotification["event"],
    message: string
  ): void {
    const notification: JobNotification = {
      jobId,
      event,
      timestamp: Date.now(),
      message,
    };
    this.emit("notification", notification);
    this.emit(`job:${event}`, notification);
  }
}
