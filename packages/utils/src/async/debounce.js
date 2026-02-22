"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounce = debounce;
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
function debounce(fn, waitMs, options = {}) {
    const { leading = false, trailing = true } = options;
    let timer = null;
    let lastArgs = null;
    let isPending = false;
    function invoke() {
        if (lastArgs) {
            const args = lastArgs;
            lastArgs = null;
            isPending = false;
            fn(...args);
        }
    }
    const debounced = function (...args) {
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
    };
    debounced.cancel = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
        lastArgs = null;
        isPending = false;
    };
    debounced.flush = () => {
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
//# sourceMappingURL=debounce.js.map