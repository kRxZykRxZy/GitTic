/**
 * Options for the async queue.
 */
export interface QueueOptions {
  /** Maximum number of concurrent tasks. Defaults to 1 (serial). */
  concurrency?: number;
  /** Whether to start processing immediately. Defaults to true. */
  autoStart?: boolean;
}

/**
 * An async task queue that processes tasks with controlled concurrency.
 *
 * @example
 * ```ts
 * const queue = new AsyncQueue({ concurrency: 3 });
 *
 * queue.add(async () => {
 *   await processItem(1);
 * });
 * queue.add(async () => {
 *   await processItem(2);
 * });
 *
 * await queue.drain();
 * ```
 */
export class AsyncQueue {
  private readonly _concurrency: number;
  private readonly _queue: Array<() => Promise<void>> = [];
  private _running: number = 0;
  private _paused: boolean;
  private _drainResolvers: Array<() => void> = [];

  constructor(options: QueueOptions = {}) {
    const { concurrency = 1, autoStart = true } = options;
    this._concurrency = Math.max(1, concurrency);
    this._paused = !autoStart;
  }

  /**
   * Add a task to the queue.
   *
   * @param task - An async function to execute.
   * @returns A promise that resolves when the task completes.
   */
  add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this._queue.push(async () => {
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this._process();
    });
  }

  /**
   * Pause the queue. Running tasks will complete, but no new tasks
   * will start.
   */
  pause(): void {
    this._paused = true;
  }

  /**
   * Resume the queue and begin processing pending tasks.
   */
  resume(): void {
    this._paused = false;
    this._process();
  }

  /**
   * Wait for all pending and running tasks to complete.
   *
   * @returns A promise that resolves when the queue is empty.
   */
  drain(): Promise<void> {
    if (this._queue.length === 0 && this._running === 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this._drainResolvers.push(resolve);
    });
  }

  /**
   * Remove all pending (not yet started) tasks from the queue.
   */
  clear(): void {
    this._queue.length = 0;
  }

  /** The number of tasks currently running. */
  get running(): number {
    return this._running;
  }

  /** The number of tasks waiting in the queue. */
  get pending(): number {
    return this._queue.length;
  }

  /** The total number of tasks (running + pending). */
  get size(): number {
    return this._running + this._queue.length;
  }

  /**
   * Process the next tasks in the queue, up to the concurrency limit.
   */
  private _process(): void {
    if (this._paused) {
      return;
    }

    while (this._running < this._concurrency && this._queue.length > 0) {
      const task = this._queue.shift()!;
      this._running++;

      task().finally(() => {
        this._running--;
        this._process();

        if (this._queue.length === 0 && this._running === 0) {
          for (const resolve of this._drainResolvers) {
            resolve();
          }
          this._drainResolvers = [];
        }
      });
    }
  }
}
