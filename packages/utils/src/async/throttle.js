"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttle = throttle;
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
function throttle(fn, intervalMs, options = {}) {
    const { leading = true, trailing = true } = options;
    let timer = null;
    let lastArgs = null;
    let lastCallTime = null;
    let isPending = false;
    function invoke(args) {
        lastCallTime = Date.now();
        fn(...args);
    }
    const throttled = function (...args) {
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
        }
        else if (trailing && timer === null) {
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
    };
    throttled.cancel = () => {
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
//# sourceMappingURL=throttle.js.map