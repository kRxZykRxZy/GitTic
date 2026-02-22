/**
 * Options for deep merge operations.
 */
export interface DeepMergeOptions {
    /** Whether to merge arrays by concatenating them. Defaults to false (replace). */
    mergeArrays?: boolean;
    /** Maximum merge depth. Defaults to Infinity. */
    maxDepth?: number;
}
/**
 * Deep merge two objects together. Properties from the source object
 * are merged into the target object recursively.
 *
 * @param target - The target object.
 * @param source - The source object to merge from.
 * @param options - Optional merge configuration.
 * @returns A new merged object (neither target nor source is mutated).
 *
 * @example
 * ```ts
 * const a = { user: { name: "Alice", settings: { theme: "dark" } } };
 * const b = { user: { settings: { lang: "en" } } };
 * deepMerge(a, b);
 * // => { user: { name: "Alice", settings: { theme: "dark", lang: "en" } } }
 * ```
 */
export declare function deepMerge<T extends Record<string, unknown>, U extends Record<string, unknown>>(target: T, source: U, options?: DeepMergeOptions): T & U;
/**
 * Deep merge multiple objects together, left to right.
 *
 * @param objects - The objects to merge.
 * @param options - Optional merge configuration.
 * @returns A new object with all inputs merged.
 *
 * @example
 * ```ts
 * deepMergeAll([{ a: 1 }, { b: 2 }, { c: 3 }]);
 * // => { a: 1, b: 2, c: 3 }
 * ```
 */
export declare function deepMergeAll(objects: ReadonlyArray<Record<string, unknown>>, options?: DeepMergeOptions): Record<string, unknown>;
//# sourceMappingURL=deep-merge.d.ts.map