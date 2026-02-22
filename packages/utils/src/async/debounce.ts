/**
 * A debounced function wrapper with cancel capability.
 */
export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  /** Call the debounced function. */
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation. */
  cancel(): void;
  /** Immediately invoke any pending call. */
  flush(): void;
  /** Whether there is a pending invocation. */
  readonly pending: boolean;
}

/**
 * Options for debounce.
 */
export interface DebounceOptions {
  /** Whether to invoke on the leading edge. Defaults to false. */
  leading?: boolean;
  /** Whether to invoke on the trailing edge. Defaults to true. */
  trailing?: boolean;
}

/**
 * Create a debounced version of a function that delays invocation
 * until after the specified wait time has elapsed since the last call.
 *
 * @param fn - The function to debounce.
 * @param waitMs - The debounce delay in milliseconds.
 * @param options - Optional debounce configuration.
 * @returns A debounced function with cancel and flush methods.
 *
 * @example
 * ```ts
 * const debouncedSearch = debounce((query: string) => {
 *   search(query);
 * }, 300);
 *
 * // Called rapidly, but only executes once after 300ms of inactivity
 * debouncedSearch("hello");
 * debouncedSearch("hello w");
 * debouncedSearch("hello world");
 * ```
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  waitMs: number,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const { leading = false, trailing = true } = options;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let isPending = false;

  function invoke(): void {
    if (lastArgs) {
      const args = lastArgs;
      lastArgs = null;
      isPending = false;
      fn(...args);
    }
  }

  const debounced = function (this: unknown, ...args: Parameters<T>): void {
    lastArgs = args;

    if (timer !== null) {
      clearTimeout(timer);
    }

    if (leading && !isPending) {
      isPending = true;
      fn(...args);
      timer = setTimeout(() => {
        timer = null;
        isPending = false;
      }, waitMs);
      return;
    }

    isPending = true;
    timer = setTimeout(() => {
      timer = null;
      if (trailing) {
        invoke();
      }
      isPending = false;
    }, waitMs);
  } as DebouncedFunction<T>;

  debounced.cancel = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
    isPending = false;
  };

  debounced.flush = (): void => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    invoke();
  };

  Object.defineProperty(debounced, "pending", {
    get: () => isPending,
  });

  return debounced;
}
