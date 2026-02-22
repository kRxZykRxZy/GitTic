/**
 * Return a new array with only unique elements, preserving order.
 *
 * @param array - The input array.
 * @returns A new array with duplicates removed.
 *
 * @example
 * ```ts
 * unique([1, 2, 2, 3, 1]); // => [1, 2, 3]
 * ```
 */
export function unique<T>(array: readonly T[]): T[] {
  return [...new Set(array)];
}

/**
 * Return a new array with unique elements based on a key function.
 * When duplicates are found, the first occurrence is kept.
 *
 * @param array - The input array.
 * @param keyFn - A function that extracts the key for comparison.
 * @returns A new array with duplicates removed based on the key.
 *
 * @example
 * ```ts
 * const users = [
 *   { id: 1, name: "Alice" },
 *   { id: 2, name: "Bob" },
 *   { id: 1, name: "Alice Copy" },
 * ];
 * uniqueBy(users, u => u.id);
 * // => [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }]
 * ```
 */
export function uniqueBy<T, K>(
  array: readonly T[],
  keyFn: (item: T) => K,
): T[] {
  const seen = new Set<K>();
  const result: T[] = [];

  for (const item of array) {
    const key = keyFn(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }

  return result;
}

/**
 * Count the occurrences of each element in an array.
 *
 * @param array - The input array.
 * @returns A Map from element to its occurrence count.
 *
 * @example
 * ```ts
 * countOccurrences(["a", "b", "a", "c", "b", "a"]);
 * // => Map { "a" => 3, "b" => 2, "c" => 1 }
 * ```
 */
export function countOccurrences<T>(array: readonly T[]): Map<T, number> {
  const counts = new Map<T, number>();
  for (const item of array) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  return counts;
}

/**
 * Find duplicate elements in an array.
 *
 * @param array - The input array.
 * @returns A new array of elements that appear more than once.
 *
 * @example
 * ```ts
 * duplicates([1, 2, 3, 2, 4, 1]); // => [2, 1]
 * ```
 */
export function duplicates<T>(array: readonly T[]): T[] {
  const counts = countOccurrences(array);
  const result: T[] = [];

  for (const [item, count] of counts) {
    if (count > 1) {
      result.push(item);
    }
  }

  return result;
}

/**
 * Return the symmetric difference between two arrays —
 * elements that exist in either array but not both.
 *
 * @param a - The first array.
 * @param b - The second array.
 * @returns An array of elements unique to one of the two input arrays.
 *
 * @example
 * ```ts
 * symmetricDifference([1, 2, 3], [2, 3, 4]); // => [1, 4]
 * ```
 */
export function symmetricDifference<T>(
  a: readonly T[],
  b: readonly T[],
): T[] {
  const setA = new Set(a);
  const setB = new Set(b);
  const result: T[] = [];

  for (const item of setA) {
    if (!setB.has(item)) {
      result.push(item);
    }
  }
  for (const item of setB) {
    if (!setA.has(item)) {
      result.push(item);
    }
  }

  return result;
}
