"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pool = void 0;
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
class Pool {
    _concurrency;
    _running = 0;
    _waiting = [];
    _started;
    constructor(options) {
        this._concurrency = Math.max(1, options.concurrency);
        this._started = options.autoStart !== false;
    }
    /**
     * Acquire a slot in the pool. Returns a promise that resolves when
     * a slot is available.
     */
    async _acquire() {
        if (this._running < this._concurrency) {
            this._running++;
            return;
        }
        return new Promise((resolve) => {
            this._waiting.push(() => {
                this._running++;
                resolve();
            });
        });
    }
    /**
     * Release a slot back to the pool.
     */
    _release() {
        this._running--;
        const next = this._waiting.shift();
        if (next) {
            next();
        }
    }
    /**
     * Execute a single task within the pool's concurrency limit.
     *
     * @param task - The async function to execute.
     * @returns The task result.
     */
    async exec(task) {
        await this._acquire();
        const start = Date.now();
        try {
            const value = await task();
            return {
                value,
                success: true,
                durationMs: Date.now() - start,
            };
        }
        catch (err) {
            return {
                error: err instanceof Error ? err : new Error(String(err)),
                success: false,
                durationMs: Date.now() - start,
            };
        }
        finally {
            this._release();
        }
    }
    /**
     * Map an array of items through an async function with concurrency control.
     *
     * @param items - The input items.
     * @param fn - The async function to apply to each item.
     * @returns An array of results, in the same order as the input.
     */
    async map(items, fn) {
        const promises = items.map((item, index) => this.exec(() => fn(item, index)));
        return Promise.all(promises);
    }
    /**
     * Execute all tasks and return only the successful results.
     *
     * @param items - The input items.
     * @param fn - The async function to apply.
     * @returns An array of successful values.
     */
    async mapSettled(items, fn) {
        const results = await this.map(items, fn);
        return results
            .filter((r) => r.success && r.value !== undefined)
            .map((r) => r.value);
    }
    /** The number of currently running tasks. */
    get running() {
        return this._running;
    }
    /** The number of tasks waiting for a slot. */
    get waiting() {
        return this._waiting.length;
    }
}
exports.Pool = Pool;
//# sourceMappingURL=pool.js.map