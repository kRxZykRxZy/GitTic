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
export declare function flatten<T>(array: readonly unknown[], depth?: number): T[];
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
export declare function flattenDeep<T>(array: readonly unknown[]): T[];
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
export declare function flatMap<T, U>(array: readonly T[], fn: (item: T, index: number) => U | readonly U[]): U[];
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
export declare function compact<T>(array: readonly (T | null | undefined | false | 0 | "")[]): T[];
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
export declare function interleave<T>(a: readonly T[], b: readonly T[]): T[];
//# sourceMappingURL=flatten.d.ts.map