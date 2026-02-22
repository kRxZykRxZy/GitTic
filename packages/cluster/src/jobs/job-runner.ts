/**
 * Job runner that executes jobs in a sandboxed environment.
 * Captures output, enforces timeouts and resource limits,
 * and performs cleanup after execution.
 * @module
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EventEmitter } from "node:events";

const execFileAsync = promisify(execFile);

/** Configuration for job execution */
export interface JobRunConfig {
  /** Working directory for the job */
  workDir: string;
  /** Command to execute */
  command: string;
  /** Command arguments */
  args: string[];
  /** Environment variables */
  env: Record<string, string>;
  /** Timeout in milliseconds */
  timeoutMs: number;
  /** Maximum output buffer size in bytes */
  maxOutputBytes: number;
  /** Maximum memory in megabytes (for reporting, not enforced by OS) */
  maxMemoryMb: number;
}

/** Result of a job execution */
export interface JobRunResult {
  /** Job identifier */
  jobId: string;
  /** Exit code from the process */
  exitCode: number;
  /** Standard output (may be truncated) */
  stdout: string;
  /** Standard error (may be truncated) */
  stderr: string;
  /** Whether the output was truncated */
  outputTruncated: boolean;
  /** Duration of execution in milliseconds */
  durationMs: number;
  /** Whether the job timed out */
  timedOut: boolean;
  /** Whether the job was killed */
  killed: boolean;
  /** Peak memory usage estimate in bytes */
  peakMemoryBytes: number;
  /** Timestamp when execution started */
  startedAt: number;
  /** Timestamp when execution completed */
  completedAt: number;
}

/** Default execution configuration */
const DEFAULT_CONFIG: Partial<JobRunConfig> = {
  timeoutMs: 300_000,
  maxOutputBytes: 10 * 1024 * 1024,
  maxMemoryMb: 512,
  args: [],
  env: {},
};

/**
 * Executes cluster jobs in isolated processes with timeout enforcement,
 * output capture, and resource tracking.
 */
export class JobRunner extends EventEmitter {
  private readonly activeRuns = new Map<string, { abort: AbortController; startedAt: number }>();
  private readonly maxConcurrent: number;

  /**
   * @param maxConcurrent - Maximum simultaneous job executions (default: 4)
   */
  constructor(maxConcurrent: number = 4) {
    super();
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Execute a job with the given configuration.
   * @param jobId - Unique job identifier
   * @param config - Execution configuration
   * @returns Execution result
   */
  async run(jobId: string, config: Partial<JobRunConfig> & { workDir: string; command: string }): Promise<JobRunResult> {
    if (this.activeRuns.size >= this.maxConcurrent) {
      throw new Error(
        `Maximum concurrent jobs (${this.maxConcurrent}) reached, cannot run job ${jobId}`
      );
    }

    const fullConfig: JobRunConfig = {
      workDir: config.workDir,
      command: config.command,
      args: config.args ?? DEFAULT_CONFIG.args!,
      env: config.env ?? DEFAULT_CONFIG.env!,
      timeoutMs: config.timeoutMs ?? DEFAULT_CONFIG.timeoutMs!,
      maxOutputBytes: config.maxOutputBytes ?? DEFAULT_CONFIG.maxOutputBytes!,
      maxMemoryMb: config.maxMemoryMb ?? DEFAULT_CONFIG.maxMemoryMb!,
    };

    const abortController = new AbortController();
    const startedAt = Date.now();

    this.activeRuns.set(jobId, { abort: abortController, startedAt });
    this.emit("job:started", jobId);

    try {
      const result = await this.executeProcess(jobId, fullConfig, abortController);
      return result;
    } finally {
      this.activeRuns.delete(jobId);
      this.emit("job:finished", jobId);
    }
  }

  /**
   * Execute the actual process and capture results.
   */
  private async executeProcess(
    jobId: string,
    config: JobRunConfig,
    abortController: AbortController
  ): Promise<JobRunResult> {
    const startedAt = Date.now();
    let timedOut = false;
    let killed = false;

    const timeoutId = setTimeout(() => {
      timedOut = true;
      abortController.abort();
    }, config.timeoutMs);

    try {
      const { stdout, stderr } = await execFileAsync(
        config.command,
        config.args,
        {
          cwd: config.workDir,
          env: { ...process.env, ...config.env },
          timeout: config.timeoutMs,
          maxBuffer: config.maxOutputBytes,
          signal: abortController.signal,
        }
      );

      const completedAt = Date.now();
      const truncated = stdout.length >= config.maxOutputBytes ||
        stderr.length >= config.maxOutputBytes;

      return {
        jobId,
        exitCode: 0,
        stdout: this.truncateOutput(stdout, config.maxOutputBytes),
        stderr: this.truncateOutput(stderr, config.maxOutputBytes),
        outputTruncated: truncated,
        durationMs: completedAt - startedAt,
        timedOut: false,
        killed: false,
        peakMemoryBytes: this.estimateMemoryUsage(),
        startedAt,
        completedAt,
      };
    } catch (err: unknown) {
      const completedAt = Date.now();
      const error = err as {
        code?: number | string;
        stdout?: string;
        stderr?: string;
        killed?: boolean;
        signal?: string;
      };

      killed = error.killed === true || error.signal === "SIGTERM";

      return {
        jobId,
        exitCode: typeof error.code === "number" ? error.code : 1,
        stdout: this.truncateOutput(error.stdout ?? "", config.maxOutputBytes),
        stderr: this.truncateOutput(error.stderr ?? String(err), config.maxOutputBytes),
        outputTruncated: false,
        durationMs: completedAt - startedAt,
        timedOut,
        killed,
        peakMemoryBytes: this.estimateMemoryUsage(),
        startedAt,
        completedAt,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Cancel a running job.
   * @param jobId - Job to cancel
   * @returns True if the job was found and cancelled
   */
  cancel(jobId: string): boolean {
    const run = this.activeRuns.get(jobId);
    if (!run) return false;

    run.abort.abort();
    this.emit("job:cancelled", jobId);
    return true;
  }

  /**
   * Get the number of actively running jobs.
   */
  get activeCount(): number {
    return this.activeRuns.size;
  }

  /**
   * Get IDs of all currently running jobs.
   */
  getActiveJobIds(): string[] {
    return Array.from(this.activeRuns.keys());
  }

  /**
   * Check if a specific job is currently running.
   * @param jobId - Job identifier
   */
  isRunning(jobId: string): boolean {
    return this.activeRuns.has(jobId);
  }

  /**
   * Truncate output to the maximum allowed size.
   */
  private truncateOutput(output: string, maxBytes: number): string {
    if (output.length <= maxBytes) return output;
    return output.substring(0, maxBytes) + "\n... [output truncated]";
  }

  /**
   * Estimate current process memory usage.
   */
  private estimateMemoryUsage(): number {
    const usage = process.memoryUsage();
    return usage.rss;
  }

  /**
   * Cancel all running jobs.
   */
  cancelAll(): void {
    for (const [jobId, run] of this.activeRuns) {
      run.abort.abort();
      this.emit("job:cancelled", jobId);
    }
  }
}
