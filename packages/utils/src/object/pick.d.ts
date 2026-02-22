/**
 * Pick specified keys from an object, returning a new object with
 * only those keys.
 *
 * @param obj - The source object.
 * @param keys - The keys to pick.
 * @returns A new object containing only the specified keys.
 *
 * @example
 * ```ts
 * pick({ a: 1, b: 2, c: 3 }, ["a", "c"]);
 * // => { a: 1, c: 3 }
 * ```
 */
export declare function pick<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K>;
/**
 * Pick keys from an object based on a predicate function.
 *
 * @param obj - The source object.
 * @param predicate - A function that returns true for keys to include.
 * @returns A new object containing only keys that pass the predicate.
 *
 * @example
 * ```ts
 * pickBy({ a: 1, b: null, c: 3 }, (_key, value) => value != null);
 * // => { a: 1, c: 3 }
 * ```
 */
export declare function pickBy<T extends Record<string, unknown>>(obj: T, predicate: (key: string, value: unknown) => boolean): Partial<T>;
/**
 * Pick deeply nested values from an object using dot-notation paths.
 *
 * @param obj - The source object.
 * @param paths - An array of dot-separated paths (e.g., "user.name").
 * @returns A new object with only the specified nested values.
 *
 * @example
 * ```ts
 * pickDeep(
 *   { user: { name: "Alice", age: 30, email: "a@b.com" } },
 *   ["user.name", "user.email"]
 * );
 * // => { user: { name: "Alice", email: "a@b.com" } }
 * ```
 */
export declare function pickDeep(obj: Record<string, unknown>, paths: readonly string[]): Record<string, unknown>;
//# sourceMappingURL=pick.d.ts.map