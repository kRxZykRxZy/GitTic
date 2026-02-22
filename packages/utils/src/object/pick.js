"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pick = pick;
exports.pickBy = pickBy;
exports.pickDeep = pickDeep;
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
function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
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
function pickBy(obj, predicate) {
    const result = {};
    for (const key of Object.keys(obj)) {
        if (predicate(key, obj[key])) {
            result[key] = obj[key];
        }
    }
    return result;
}
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
function pickDeep(obj, paths) {
    const result = {};
    for (const path of paths) {
        const parts = path.split(".");
        const value = getNestedValue(obj, parts);
        if (value !== undefined) {
            setNestedValue(result, parts, value);
        }
    }
    return result;
}
/**
 * Get a nested value from an object by an array of keys.
 */
function getNestedValue(obj, keys) {
    let current = obj;
    for (const key of keys) {
        if (current == null || typeof current !== "object") {
            return undefined;
        }
        current = current[key];
    }
    return current;
}
/**
 * Set a nested value in an object by an array of keys.
 */
function setNestedValue(obj, keys, value) {
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== "object") {
            current[key] = {};
        }
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
}
//# sourceMappingURL=pick.js.map