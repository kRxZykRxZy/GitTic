/**
 * Create a new object by omitting specified keys from the source object.
 *
 * @param obj - The source object.
 * @param keys - The keys to omit.
 * @returns A new object without the specified keys.
 *
 * @example
 * ```ts
 * omit({ a: 1, b: 2, c: 3 }, ["b"]);
 * // => { a: 1, c: 3 }
 * ```
 */
export declare function omit<T extends Record<string, unknown>, K extends keyof T>(obj: T, keys: readonly K[]): Omit<T, K>;
/**
 * Create a new object by omitting keys that match a predicate.
 *
 * @param obj - The source object.
 * @param predicate - A function that returns true for keys to omit.
 * @returns A new object without the matched keys.
 *
 * @example
 * ```ts
 * omitBy({ a: 1, b: null, c: 3, d: undefined }, (_key, value) => value == null);
 * // => { a: 1, c: 3 }
 * ```
 */
export declare function omitBy<T extends Record<string, unknown>>(obj: T, predicate: (key: string, value: unknown) => boolean): Partial<T>;
/**
 * Omit keys from an object whose values are null or undefined.
 *
 * @param obj - The source object.
 * @returns A new object with null and undefined values removed.
 *
 * @example
 * ```ts
 * omitNullish({ a: 1, b: null, c: undefined, d: 0, e: "" });
 * // => { a: 1, d: 0, e: "" }
 * ```
 */
export declare function omitNullish<T extends Record<string, unknown>>(obj: T): Partial<T>;
/**
 * Omit keys from an object whose values are falsy
 * (null, undefined, false, 0, "", NaN).
 *
 * @param obj - The source object.
 * @returns A new object with falsy values removed.
 *
 * @example
 * ```ts
 * omitFalsy({ a: 1, b: 0, c: "", d: false, e: "hello" });
 * // => { a: 1, e: "hello" }
 * ```
 */
export declare function omitFalsy<T extends Record<string, unknown>>(obj: T): Partial<T>;
/**
 * Deeply omit specified keys from a nested object structure.
 *
 * @param obj - The source object.
 * @param keys - The keys to omit at all nesting levels.
 * @returns A new object with the keys removed at every level.
 *
 * @example
 * ```ts
 * omitDeep({ a: 1, b: { a: 2, c: 3 } }, ["a"]);
 * // => { b: { c: 3 } }
 * ```
 */
export declare function omitDeep(obj: Record<string, unknown>, keys: readonly string[]): Record<string, unknown>;
//# sourceMappingURL=omit.d.ts.map