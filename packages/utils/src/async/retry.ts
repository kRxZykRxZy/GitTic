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
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 30000,
    shouldRetry = () => true,
    onRetry,
  } = options;

  let lastError: Error | undefined;
  let delay = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
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
export async function retrySafe<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const errors: Error[] = [];
  const modifiedOptions: RetryOptions = {
    ...options,
    onRetry: (error, attempt, delayMs) => {
      errors.push(error);
      options.onRetry?.(error, attempt, delayMs);
    },
  };

  try {
    const value = await retry(fn, modifiedOptions);
    return { value, success: true, attempts: errors.length + 1, errors };
  } catch (err) {
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
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
