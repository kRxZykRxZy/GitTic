"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.groupBy = groupBy;
exports.groupByToObject = groupByToObject;
exports.partition = partition;
exports.countBy = countBy;
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
function groupBy(array, keyFn) {
    const map = new Map();
    for (const item of array) {
        const key = keyFn(item);
        const group = map.get(key);
        if (group) {
            group.push(item);
        }
        else {
            map.set(key, [item]);
        }
    }
    return map;
}
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
function groupByToObject(array, keyFn) {
    const result = {};
    for (const item of array) {
        const key = keyFn(item);
        if (!(key in result)) {
            result[key] = [];
        }
        result[key].push(item);
    }
    return result;
}
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
function partition(array, predicate) {
    const pass = [];
    const fail = [];
    for (const item of array) {
        if (predicate(item)) {
            pass.push(item);
        }
        else {
            fail.push(item);
        }
    }
    return [pass, fail];
}
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
function countBy(array, keyFn) {
    const counts = new Map();
    for (const item of array) {
        const key = keyFn(item);
        counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
}
//# sourceMappingURL=group-by.js.map