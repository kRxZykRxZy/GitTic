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
export declare function throttle<T extends (...args: unknown[]) => unknown>(fn: T, intervalMs: number, options?: ThrottleOptions): ThrottledFunction<T>;
//# sourceMappingURL=throttle.d.ts.map