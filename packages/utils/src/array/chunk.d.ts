/**
 * Split an array into chunks of a specified size.
 *
 * @param array - The array to split.
 * @param size - The maximum size of each chunk. Must be a positive integer.
 * @returns An array of chunks (sub-arrays).
 * @throws If size is not a positive integer.
 *
 * @example
 * ```ts
 * chunk([1, 2, 3, 4, 5], 2);
 * // => [[1, 2], [3, 4], [5]]
 * ```
 */
export declare function chunk<T>(array: readonly T[], size: number): T[][];
/**
 * Split an array into a specified number of roughly equal groups.
 *
 * @param array - The array to split.
 * @param groups - The number of groups. Must be a positive integer.
 * @returns An array of groups (sub-arrays).
 * @throws If groups is not a positive integer.
 *
 * @example
 * ```ts
 * chunkIntoGroups([1, 2, 3, 4, 5], 3);
 * // => [[1, 2], [3, 4], [5]]
 * ```
 */
export declare function chunkIntoGroups<T>(array: readonly T[], groups: number): T[][];
/**
 * Create a sliding window over an array, returning overlapping chunks.
 *
 * @param array - The source array.
 * @param windowSize - The size of each window.
 * @param step - The step between window starts. Defaults to 1.
 * @returns An array of overlapping sub-arrays.
 *
 * @example
 * ```ts
 * slidingWindow([1, 2, 3, 4, 5], 3);
 * // => [[1, 2, 3], [2, 3, 4], [3, 4, 5]]
 *
 * slidingWindow([1, 2, 3, 4, 5], 3, 2);
 * // => [[1, 2, 3], [3, 4, 5]]
 * ```
 */
export declare function slidingWindow<T>(array: readonly T[], windowSize: number, step?: number): T[][];
//# sourceMappingURL=chunk.d.ts.map