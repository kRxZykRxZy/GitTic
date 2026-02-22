/**
 * Create a deep clone of a value using structured cloning semantics.
 * Handles plain objects, arrays, Date, RegExp, Map, Set, and primitives.
 *
 * @param value - The value to clone.
 * @returns A deep copy of the value.
 *
 * @example
 * ```ts
 * const original = { a: { b: [1, 2, 3] }, date: new Date() };
 * const cloned = deepClone(original);
 * cloned.a.b.push(4);
 * // original.a.b is still [1, 2, 3]
 * ```
 */
export declare function deepClone<T>(value: T): T;
/**
 * Deep freeze an object, making it and all nested objects immutable.
 *
 * @param obj - The object to freeze.
 * @returns The frozen object.
 */
export declare function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T>;
//# sourceMappingURL=deep-clone.d.ts.map