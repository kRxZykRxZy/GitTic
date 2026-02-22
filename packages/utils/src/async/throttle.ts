/**
 * A throttled function wrapper with cancel capability.
 */
export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  /** Call the throttled function. */
  (...args: Parameters<T>): void;
  /** Cancel any pending trailing invocation. */
  cancel(): void;
  /** Whether there is a pending trailing invocation. */
  readonly pending: boolean;
}

/**
 * Options for throttle.
 */
export interface ThrottleOptions {
  /** Whether to invoke on the leading edge. Defaults to true. */
  leading?: boolean;
  /** Whether to invoke on the trailing edge. Defaults to true. */
  trailing?: boolean;
}

/**
 * Create a throttled version of a function that is invoked at most
 * once per specified interval.
 *
 * @param fn - The function to throttle.
 * @param intervalMs - The minimum interval between invocations in milliseconds.
 * @param options - Optional throttle configuration.
 * @returns A throttled function with a cancel method.
 *
 * @example
 * ```ts
 * const throttledScroll = throttle(() => {
 *   updateScrollPosition();
 * }, 100);
 *
 * // Called many times, but executes at most once every 100ms
 * window.addEventListener("scroll", throttledScroll);
 * ```
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  intervalMs: number,
  options: ThrottleOptions = {},
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let isPending = false;

  function invoke(args: Parameters<T>): void {
    lastCallTime = Date.now();
    fn(...args);
  }

  const throttled = function (this: unknown, ...args: Parameters<T>): void {
    const now = Date.now();
    lastArgs = args;

    if (lastCallTime === null && !leading) {
      lastCallTime = now;
    }

    const elapsed = lastCallTime !== null ? now - lastCallTime : intervalMs;
    const remaining = intervalMs - elapsed;

    if (remaining <= 0) {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      isPending = false;
      invoke(args);
    } else if (trailing && timer === null) {
      isPending = true;
      timer = setTimeout(() => {
        timer = null;
        isPending = false;
        if (lastArgs) {
          invoke(lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  } as ThrottledFunction<T>;

  throttled.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    lastCallTime = null;
    isPending = false;
  };

  Object.defineProperty(throttled, "pending", {
    get: () => isPending,
  });

  return throttled;
}
