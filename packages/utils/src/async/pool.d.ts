/**
 * Options for the worker pool.
 */
export interface PoolOptions {
    /** Maximum number of concurrent workers. */
    concurrency: number;
    /** Whether to start processing immediately. Defaults to true. */
    autoStart?: boolean;
}
/**
 * Result of a pool task execution.
 */
export interface PoolTaskResult<T> {
    /** The result value if the task succeeded. */
    value?: T;
    /** The error if the task failed. */
    error?: Error;
    /** Whether the task succeeded. */
    success: boolean;
    /** Duration of the task in milliseconds. */
    durationMs: number;
}
/**
 * An async worker pool that limits the number of concurrently
 * running async operations.
 *
 * @example
 * ```ts
 * const pool = new Pool({ concurrency: 5 });
 *
 * const urls = ["url1", "url2", "url3", ...];
 * const results = await pool.map(urls, async (url) => {
 *   const res = await fetch(url);
 *   return res.json();
 * });
 * ```
 */
export declare class Pool {
    private readonly _concurrency;
    private _running;
    private readonly _waiting;
    private _started;
    constructor(options: PoolOptions);
    /**
     * Acquire a slot in the pool. Returns a promise that resolves when
     * a slot is available.
     */
    private _acquire;
    /**
     * Release a slot back to the pool.
     */
    private _release;
    /**
     * Execute a single task within the pool's concurrency limit.
     *
     * @param task - The async function to execute.
     * @returns The task result.
     */
    exec<T>(task: () => Promise<T>): Promise<PoolTaskResult<T>>;
    /**
     * Map an array of items through an async function with concurrency control.
     *
     * @param items - The input items.
     * @param fn - The async function to apply to each item.
     * @returns An array of results, in the same order as the input.
     */
    map<T, R>(items: readonly T[], fn: (item: T, index: number) => Promise<R>): Promise<PoolTaskResult<R>[]>;
    /**
     * Execute all tasks and return only the successful results.
     *
     * @param items - The input items.
     * @param fn - The async function to apply.
     * @returns An array of successful values.
     */
    mapSettled<T, R>(items: readonly T[], fn: (item: T, index: number) => Promise<R>): Promise<R[]>;
    /** The number of currently running tasks. */
    get running(): number;
    /** The number of tasks waiting for a slot. */
    get waiting(): number;
}
//# sourceMappingURL=pool.d.ts.map