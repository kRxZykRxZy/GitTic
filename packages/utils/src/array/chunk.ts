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
export function chunk<T>(array: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) {
    throw new RangeError("Chunk size must be a positive integer");
  }

  const result: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

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
export function chunkIntoGroups<T>(
  array: readonly T[],
  groups: number,
): T[][] {
  if (!Number.isInteger(groups) || groups <= 0) {
    throw new RangeError("Number of groups must be a positive integer");
  }

  const size = Math.ceil(array.length / groups);
  return chunk(array, size);
}

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
export function slidingWindow<T>(
  array: readonly T[],
  windowSize: number,
  step: number = 1,
): T[][] {
  if (!Number.isInteger(windowSize) || windowSize <= 0) {
    throw new RangeError("Window size must be a positive integer");
  }
  if (!Number.isInteger(step) || step <= 0) {
    throw new RangeError("Step must be a positive integer");
  }

  const result: T[][] = [];
  for (let i = 0; i <= array.length - windowSize; i += step) {
    result.push(array.slice(i, i + windowSize));
  }
  return result;
}
