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
export declare class AsyncQueue {
    private readonly _concurrency;
    private readonly _queue;
    private _running;
    private _paused;
    private _drainResolvers;
    constructor(options?: QueueOptions);
    /**
     * Add a task to the queue.
     *
     * @param task - An async function to execute.
     * @returns A promise that resolves when the task completes.
     */
    add<T>(task: () => Promise<T>): Promise<T>;
    /**
     * Pause the queue. Running tasks will complete, but no new tasks
     * will start.
     */
    pause(): void;
    /**
     * Resume the queue and begin processing pending tasks.
     */
    resume(): void;
    /**
     * Wait for all pending and running tasks to complete.
     *
     * @returns A promise that resolves when the queue is empty.
     */
    drain(): Promise<void>;
    /**
     * Remove all pending (not yet started) tasks from the queue.
     */
    clear(): void;
    /** The number of tasks currently running. */
    get running(): number;
    /** The number of tasks waiting in the queue. */
    get pending(): number;
    /** The total number of tasks (running + pending). */
    get size(): number;
    /**
     * Process the next tasks in the queue, up to the concurrency limit.
     */
    private _process;
}
//# sourceMappingURL=queue.d.ts.map