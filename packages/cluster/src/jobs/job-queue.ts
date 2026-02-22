/**
 * Job queue with priority levels and retry logic.
 * Supports priority-based enqueue/dequeue, dead-letter handling,
 * and configurable retry policies.
 * @module
 */

import { randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";

/** Priority levels for jobs */
export enum JobPriority {
  Critical = 0,
  High = 1,
  Normal = 2,
  Low = 3,
  Background = 4,
}

/** Job status in the queue lifecycle */
export type QueuedJobStatus = "queued" | "processing" | "completed" | "failed" | "dead-letter";

/** A job entry in the queue */
export interface QueuedJob {
  /** Unique job identifier */
  id: string;
  /** Job type/name */
  type: string;
  /** Job payload data */
  payload: Record<string, unknown>;
  /** Priority level */
  priority: JobPriority;
  /** Current status */
  status: QueuedJobStatus;
  /** Number of attempts made */
  attempts: number;
  /** Maximum retry attempts */
  maxAttempts: number;
  /** When the job was enqueued */
  enqueuedAt: number;
  /** When the job started processing */
  startedAt: number | null;
  /** When the job completed or failed */
  completedAt: number | null;
  /** Error message if failed */
  error: string | null;
  /** Delay before processing in milliseconds */
  delayMs: number;
  /** Target node ID (if pinned) */
  targetNodeId: string | null;
}

/** Options for enqueuing a job */
export interface EnqueueOptions {
  /** Job type/name */
  type: string;
  /** Job payload */
  payload: Record<string, unknown>;
  /** Priority level (default: Normal) */
  priority?: JobPriority;
  /** Max retry attempts (default: 3) */
  maxAttempts?: number;
  /** Processing delay in ms (default: 0) */
  delayMs?: number;
  /** Pin to a specific node */
  targetNodeId?: string | null;
}

/**
 * Priority-based job queue with dead-letter support.
 * Jobs are dequeued in priority order (lower number = higher priority),
 * with FIFO ordering within the same priority level.
 */
export class JobQueue extends EventEmitter {
  private readonly queue: QueuedJob[] = [];
  private readonly deadLetterQueue: QueuedJob[] = [];
  private readonly processing = new Map<string, QueuedJob>();
  private readonly maxDeadLetterSize: number;

  /**
   * @param maxDeadLetterSize - Maximum entries in dead-letter queue (default: 1000)
   */
  constructor(maxDeadLetterSize: number = 1000) {
    super();
    this.maxDeadLetterSize = maxDeadLetterSize;
  }

  /**
   * Add a job to the queue.
   * @param options - Job options
   * @returns The created job
   */
  enqueue(options: EnqueueOptions): QueuedJob {
    const job: QueuedJob = {
      id: randomUUID(),
      type: options.type,
      payload: options.payload,
      priority: options.priority ?? JobPriority.Normal,
      status: "queued",
      attempts: 0,
      maxAttempts: options.maxAttempts ?? 3,
      enqueuedAt: Date.now(),
      startedAt: null,
      completedAt: null,
      error: null,
      delayMs: options.delayMs ?? 0,
      targetNodeId: options.targetNodeId ?? null,
    };

    // Insert in priority order
    const insertIndex = this.queue.findIndex((j) => j.priority > job.priority);
    if (insertIndex === -1) {
      this.queue.push(job);
    } else {
      this.queue.splice(insertIndex, 0, job);
    }

    this.emit("job:enqueued", job);
    return job;
  }

  /**
   * Dequeue the highest-priority job that is ready for processing.
   * Respects delay settings and optional node filtering.
   * @param nodeId - Optional node ID for pinned job selection
   * @returns The next job or null if none available
   */
  dequeue(nodeId?: string): QueuedJob | null {
    const now = Date.now();

    const index = this.queue.findIndex((job) => {
      if (job.status !== "queued") return false;
      if (job.delayMs > 0 && now - job.enqueuedAt < job.delayMs) return false;
      if (job.targetNodeId && nodeId && job.targetNodeId !== nodeId) return false;
      return true;
    });

    if (index === -1) return null;

    const job = this.queue.splice(index, 1)[0];
    job.status = "processing";
    job.startedAt = now;
    job.attempts++;

    this.processing.set(job.id, job);
    this.emit("job:dequeued", job);

    return job;
  }

  /**
   * Mark a job as completed.
   * @param jobId - Job identifier
   * @returns True if the job was found and completed
   */
  complete(jobId: string): boolean {
    const job = this.processing.get(jobId);
    if (!job) return false;

    job.status = "completed";
    job.completedAt = Date.now();
    this.processing.delete(jobId);
    this.emit("job:completed", job);

    return true;
  }

  /**
   * Mark a job as failed. Re-enqueues if retries remain,
   * otherwise moves to the dead-letter queue.
   * @param jobId - Job identifier
   * @param error - Error message
   * @returns True if the job was found and handled
   */
  fail(jobId: string, error: string): boolean {
    const job = this.processing.get(jobId);
    if (!job) return false;

    this.processing.delete(jobId);
    job.error = error;

    if (job.attempts < job.maxAttempts) {
      // Re-enqueue with exponential backoff delay
      job.status = "queued";
      job.startedAt = null;
      job.delayMs = Math.min(1000 * Math.pow(2, job.attempts), 60_000);
      job.enqueuedAt = Date.now();

      const insertIndex = this.queue.findIndex((j) => j.priority > job.priority);
      if (insertIndex === -1) {
        this.queue.push(job);
      } else {
        this.queue.splice(insertIndex, 0, job);
      }

      this.emit("job:retrying", job);
    } else {
      job.status = "dead-letter";
      job.completedAt = Date.now();
      this.addToDeadLetter(job);
      this.emit("job:dead-letter", job);
    }

    return true;
  }

  /**
   * Get a job by ID from queue, processing, or dead-letter.
   * @param jobId - Job identifier
   */
  getJob(jobId: string): QueuedJob | undefined {
    const inProcessing = this.processing.get(jobId);
    if (inProcessing) return inProcessing;

    const inQueue = this.queue.find((j) => j.id === jobId);
    if (inQueue) return inQueue;

    return this.deadLetterQueue.find((j) => j.id === jobId);
  }

  /**
   * Get queue depth by priority level.
   */
  getDepthByPriority(): Record<JobPriority, number> {
    const counts = {
      [JobPriority.Critical]: 0,
      [JobPriority.High]: 0,
      [JobPriority.Normal]: 0,
      [JobPriority.Low]: 0,
      [JobPriority.Background]: 0,
    };

    for (const job of this.queue) {
      counts[job.priority]++;
    }

    return counts;
  }

  /** Get number of queued jobs */
  get queueLength(): number {
    return this.queue.length;
  }

  /** Get number of jobs being processed */
  get processingCount(): number {
    return this.processing.size;
  }

  /** Get dead-letter queue contents */
  getDeadLetterQueue(): QueuedJob[] {
    return [...this.deadLetterQueue];
  }

  /** Get dead-letter queue size */
  get deadLetterCount(): number {
    return this.deadLetterQueue.length;
  }

  /**
   * Add a job to the dead-letter queue, evicting the oldest if at capacity.
   */
  private addToDeadLetter(job: QueuedJob): void {
    this.deadLetterQueue.push(job);
    if (this.deadLetterQueue.length > this.maxDeadLetterSize) {
      this.deadLetterQueue.splice(0, this.deadLetterQueue.length - this.maxDeadLetterSize);
    }
  }

  /**
   * Clear all queues and processing state.
   */
  clear(): void {
    this.queue.length = 0;
    this.processing.clear();
    this.deadLetterQueue.length = 0;
  }
}
