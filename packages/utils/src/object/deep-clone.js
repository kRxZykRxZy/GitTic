"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deepClone = deepClone;
exports.deepFreeze = deepFreeze;
/**
 * Check if a value is a plain object (not an array, Date, RegExp, etc.).
 *
 * @param value - The value to check.
 * @returns `true` if the value is a plain object.
 */
function isPlainObject(value) {
    if (value === null || typeof value !== "object") {
        return false;
    }
    const proto = Object.getPrototypeOf(value);
    return proto === Object.prototype || proto === null;
}
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
function deepClone(value) {
    if (value === null || typeof value !== "object") {
        return value;
    }
    if (value instanceof Date) {
        return new Date(value.getTime());
    }
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }
    if (value instanceof Map) {
        const clonedMap = new Map();
        for (const [k, v] of value) {
            clonedMap.set(deepClone(k), deepClone(v));
        }
        return clonedMap;
    }
    if (value instanceof Set) {
        const clonedSet = new Set();
        for (const v of value) {
            clonedSet.add(deepClone(v));
        }
        return clonedSet;
    }
    if (Array.isArray(value)) {
        return value.map((item) => deepClone(item));
    }
    if (isPlainObject(value)) {
        const result = {};
        for (const key of Object.keys(value)) {
            result[key] = deepClone(value[key]);
        }
        return result;
    }
    // For other object types, return a shallow copy
    return Object.assign(Object.create(Object.getPrototypeOf(value)), value);
}
/**
 * Deep freeze an object, making it and all nested objects immutable.
 *
 * @param obj - The object to freeze.
 * @returns The frozen object.
 */
function deepFreeze(obj) {
    Object.freeze(obj);
    for (const key of Object.keys(obj)) {
        const val = obj[key];
        if (val !== null && typeof val === "object" && !Object.isFrozen(val)) {
            deepFreeze(val);
        }
    }
    return obj;
}
//# sourceMappingURL=deep-clone.js.map