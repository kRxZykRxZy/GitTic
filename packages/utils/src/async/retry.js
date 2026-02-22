"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retry = retry;
exports.retrySafe = retrySafe;
exports.sleep = sleep;
/**
 * Retry an async operation with exponential backoff.
 *
 * @param fn - The async function to retry.
 * @param options - Optional retry configuration.
 * @returns The result of the operation.
 * @throws The last error if all retry attempts fail.
 *
 * @example
 * ```ts
 * const data = await retry(
 *   () => fetchData(url),
 *   { maxAttempts: 5, initialDelayMs: 500 }
 * );
 * ```
 */
async function retry(fn, options = {}) {
    const { maxAttempts = 3, initialDelayMs = 1000, backoffMultiplier = 2, maxDelayMs = 30000, shouldRetry = () => true, onRetry, } = options;
    let lastError;
    let delay = initialDelayMs;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        }
        catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt >= maxAttempts || !shouldRetry(lastError, attempt)) {
                throw lastError;
            }
            if (onRetry) {
                onRetry(lastError, attempt, delay);
            }
            await sleep(delay);
            delay = Math.min(delay * backoffMultiplier, maxDelayMs);
        }
    }
    throw lastError;
}
/**
 * Retry an async operation and return a structured result instead of
 * throwing on final failure.
 *
 * @param fn - The async function to retry.
 * @param options - Optional retry configuration.
 * @returns A RetryResult with success status, value, and error history.
 */
async function retrySafe(fn, options = {}) {
    const errors = [];
    const modifiedOptions = {
        ...options,
        onRetry: (error, attempt, delayMs) => {
            errors.push(error);
            options.onRetry?.(error, attempt, delayMs);
        },
    };
    try {
        const value = await retry(fn, modifiedOptions);
        return { value, success: true, attempts: errors.length + 1, errors };
    }
    catch (err) {
        errors.push(err instanceof Error ? err : new Error(String(err)));
        return { success: false, attempts: errors.length, errors };
    }
}
/**
 * Sleep for a given number of milliseconds.
 *
 * @param ms - The duration to sleep in milliseconds.
 * @returns A promise that resolves after the delay.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
//# sourceMappingURL=retry.js.map