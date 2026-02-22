/**
 * Options for retry operations.
 */
export interface RetryOptions {
    /** Maximum number of retry attempts. Defaults to 3. */
    maxAttempts?: number;
    /** Initial delay in milliseconds before the first retry. Defaults to 1000. */
    initialDelayMs?: number;
    /** Multiplier for exponential backoff. Defaults to 2. */
    backoffMultiplier?: number;
    /** Maximum delay in milliseconds between retries. Defaults to 30000. */
    maxDelayMs?: number;
    /** A function that determines whether to retry based on the error. */
    shouldRetry?: (error: Error, attempt: number) => boolean;
    /** A callback invoked before each retry attempt. */
    onRetry?: (error: Error, attempt: number, delayMs: number) => void;
}
/**
 * Result of a retry operation.
 */
export interface RetryResult<T> {
    /** The result value if successful. */
    value?: T;
    /** Whether the operation eventually succeeded. */
    success: boolean;
    /** Total number of attempts made. */
    attempts: number;
    /** All errors encountered during retries. */
    errors: Error[];
}
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
export declare function retry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry an async operation and return a structured result instead of
 * throwing on final failure.
 *
 * @param fn - The async function to retry.
 * @param options - Optional retry configuration.
 * @returns A RetryResult with success status, value, and error history.
 */
export declare function retrySafe<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
/**
 * Sleep for a given number of milliseconds.
 *
 * @param ms - The duration to sleep in milliseconds.
 * @returns A promise that resolves after the delay.
 */
export declare function sleep(ms: number): Promise<void>;
//# sourceMappingURL=retry.d.ts.map