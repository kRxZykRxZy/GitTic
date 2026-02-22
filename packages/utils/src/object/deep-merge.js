"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepMerge = deepMerge;
exports.deepMergeAll = deepMergeAll;
/**
 * Check if a value is a plain object.
 */
function isPlainObject(value) {
    if (value === null || typeof value !== "object") {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
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
function deepMerge(target, source, options = {}) {
    const { mergeArrays = false, maxDepth = Infinity } = options;
    return mergeRecursive(target, source, mergeArrays, maxDepth, 0);
}
/**
 * Internal recursive merge implementation.
 */
function mergeRecursive(target, source, mergeArrays, maxDepth, currentDepth) {
    const result = { ...target };
    for (const key of Object.keys(source)) {
        const targetVal = target[key];
        const sourceVal = source[key];
        if (currentDepth < maxDepth &&
            isPlainObject(targetVal) &&
            isPlainObject(sourceVal)) {
            result[key] = mergeRecursive(targetVal, sourceVal, mergeArrays, maxDepth, currentDepth + 1);
        }
        else if (mergeArrays &&
            Array.isArray(targetVal) &&
            Array.isArray(sourceVal)) {
            result[key] = [...targetVal, ...sourceVal];
        }
        else {
            result[key] = sourceVal;
        }
    }
    return result;
}
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
function deepMergeAll(objects, options = {}) {
    if (objects.length === 0) {
        return {};
    }
    let result = {};
    for (const obj of objects) {
        result = deepMerge(result, obj, options);
    }
    return result;
}
//# sourceMappingURL=deep-merge.js.map