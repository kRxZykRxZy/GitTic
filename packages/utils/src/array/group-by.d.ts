/**
 * Group an array of items by a key extracted from each item.
 *
 * @param array - The input array.
 * @param keyFn - A function that returns the grouping key for each item.
 * @returns A Map from keys to arrays of items.
 *
 * @example
 * ```ts
 * const users = [
 *   { name: "Alice", role: "admin" },
 *   { name: "Bob", role: "user" },
 *   { name: "Charlie", role: "admin" },
 * ];
 * groupBy(users, u => u.role);
 * // => Map {
 * //   "admin" => [{ name: "Alice", role: "admin" }, { name: "Charlie", role: "admin" }],
 * //   "user" => [{ name: "Bob", role: "user" }]
 * // }
 * ```
 */
export declare function groupBy<T, K>(array: readonly T[], keyFn: (item: T) => K): Map<K, T[]>;
/**
 * Group an array of items by a key and return a plain object.
 * The key function must return a string key.
 *
 * @param array - The input array.
 * @param keyFn - A function that returns the string grouping key.
 * @returns An object from keys to arrays of items.
 *
 * @example
 * ```ts
 * groupByToObject([1, 2, 3, 4, 5], n => n % 2 === 0 ? "even" : "odd");
 * // => { odd: [1, 3, 5], even: [2, 4] }
 * ```
 */
export declare function groupByToObject<T>(array: readonly T[], keyFn: (item: T) => string): Record<string, T[]>;
/**
 * Partition an array into two groups based on a predicate.
 *
 * @param array - The input array.
 * @param predicate - A function that returns true for the "pass" group.
 * @returns A tuple of [pass, fail] arrays.
 *
 * @example
 * ```ts
 * partition([1, 2, 3, 4, 5], n => n > 3);
 * // => [[4, 5], [1, 2, 3]]
 * ```
 */
export declare function partition<T>(array: readonly T[], predicate: (item: T) => boolean): [T[], T[]];
/**
 * Create a frequency map from an array using a key function,
 * counting how many items fall into each group.
 *
 * @param array - The input array.
 * @param keyFn - A function that returns the grouping key.
 * @returns A Map from keys to counts.
 *
 * @example
 * ```ts
 * countBy(["apple", "banana", "avocado", "blueberry"], w => w[0]);
 * // => Map { "a" => 2, "b" => 2 }
 * ```
 */
export declare function countBy<T, K>(array: readonly T[], keyFn: (item: T) => K): Map<K, number>;
//# sourceMappingURL=group-by.d.ts.map