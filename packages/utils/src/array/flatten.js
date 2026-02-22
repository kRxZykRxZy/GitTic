"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.flatten = flatten;
exports.flattenDeep = flattenDeep;
exports.flatMap = flatMap;
exports.compact = compact;
exports.interleave = interleave;
/**
 * Flatten a nested array to a specified depth.
 *
 * @param array - The nested array to flatten.
 * @param depth - The maximum depth to flatten. Defaults to 1.
 * @returns A new flattened array.
 *
 * @example
 * ```ts
 * flatten([1, [2, [3, [4]]]]);     // => [1, 2, [3, [4]]]
 * flatten([1, [2, [3, [4]]]], 2);  // => [1, 2, 3, [4]]
 * ```
 */
function flatten(array, depth = 1) {
    const result = [];
    flattenRecursive(array, depth, result);
    return result;
}
/**
 * Internal recursive helper for flatten.
 */
function flattenRecursive(array, depth, result) {
    for (const item of array) {
        if (Array.isArray(item) && depth > 0) {
            flattenRecursive(item, depth - 1, result);
        }
        else {
            result.push(item);
        }
    }
}
/**
 * Completely flatten a deeply nested array to a single level.
 *
 * @param array - The nested array to flatten.
 * @returns A new single-level array.
 *
 * @example
 * ```ts
 * flattenDeep([1, [2, [3, [4, [5]]]]]); // => [1, 2, 3, 4, 5]
 * ```
 */
function flattenDeep(array) {
    return flatten(array, Infinity);
}
/**
 * Flatten and map in a single pass.
 * Maps each element using the provided function, then flattens the result
 * by one level.
 *
 * @param array - The input array.
 * @param fn - A mapping function that may return arrays.
 * @returns A new array with mapped and flattened results.
 *
 * @example
 * ```ts
 * flatMap([1, 2, 3], x => [x, x * 2]);
 * // => [1, 2, 2, 4, 3, 6]
 * ```
 */
function flatMap(array, fn) {
    const result = [];
    for (let i = 0; i < array.length; i++) {
        const mapped = fn(array[i], i);
        if (Array.isArray(mapped)) {
            result.push(...mapped);
        }
        else {
            result.push(mapped);
        }
    }
    return result;
}
/**
 * Compact an array by removing all falsy values (null, undefined, false,
 * 0, "", NaN).
 *
 * @param array - The array to compact.
 * @returns A new array with falsy values removed.
 *
 * @example
 * ```ts
 * compact([0, 1, false, 2, "", 3, null, undefined, NaN]);
 * // => [1, 2, 3]
 * ```
 */
function compact(array) {
    return array.filter(Boolean);
}
/**
 * Interleave elements from two arrays into a single array.
 *
 * @param a - The first array.
 * @param b - The second array.
 * @returns A new array with elements alternating from a and b.
 *
 * @example
 * ```ts
 * interleave([1, 3, 5], [2, 4, 6]);
 * // => [1, 2, 3, 4, 5, 6]
 * ```
 */
function interleave(a, b) {
    const result = [];
    const maxLen = Math.max(a.length, b.length);
    for (let i = 0; i < maxLen; i++) {
        if (i < a.length) {
            result.push(a[i]);
        }
        if (i < b.length) {
            result.push(b[i]);
        }
    }
    return result;
}
//# sourceMappingURL=flatten.js.map