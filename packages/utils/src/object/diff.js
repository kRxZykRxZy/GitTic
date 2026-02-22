"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diff = diff;
exports.hasDiff = hasDiff;
exports.applyDiff = applyDiff;
/**
 * Compute the differences between two objects.
 *
 * @param oldObj - The old/left object.
 * @param newObj - The new/right object.
 * @returns An array of DiffEntry objects describing each change.
 *
 * @example
 * ```ts
 * diff({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 });
 * // => [
 * //   { path: "b", type: "changed", oldValue: 2, newValue: 3 },
 * //   { path: "c", type: "added", newValue: 4 },
 * // ]
 * ```
 */
function diff(oldObj, newObj) {
    const entries = [];
    diffRecursive(oldObj, newObj, "", entries);
    return entries;
}
/**
 * Internal recursive diff implementation.
 */
function diffRecursive(oldObj, newObj, prefix, entries) {
    const allKeys = new Set([
        ...Object.keys(oldObj),
        ...Object.keys(newObj),
    ]);
    for (const key of allKeys) {
        const fullPath = prefix ? `${prefix}.${key}` : key;
        const inOld = key in oldObj;
        const inNew = key in newObj;
        if (inOld && !inNew) {
            entries.push({ path: fullPath, type: "removed", oldValue: oldObj[key] });
            continue;
        }
        if (!inOld && inNew) {
            entries.push({ path: fullPath, type: "added", newValue: newObj[key] });
            continue;
        }
        const oldVal = oldObj[key];
        const newVal = newObj[key];
        if (isPlainObject(oldVal) && isPlainObject(newVal)) {
            diffRecursive(oldVal, newVal, fullPath, entries);
        }
        else if (!isEqual(oldVal, newVal)) {
            entries.push({
                path: fullPath,
                type: "changed",
                oldValue: oldVal,
                newValue: newVal,
            });
        }
    }
}
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
 * Simple equality check for primitive values and arrays.
 */
function isEqual(a, b) {
    if (a === b) {
        return true;
    }
    if (a == null || b == null) {
        return false;
    }
    if (typeof a !== typeof b) {
        return false;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) {
            return false;
        }
        return a.every((val, i) => isEqual(val, b[i]));
    }
    return false;
}
/**
 * Check whether two objects have any differences.
 *
 * @param oldObj - The old/left object.
 * @param newObj - The new/right object.
 * @returns `true` if the objects differ.
 */
function hasDiff(oldObj, newObj) {
    return diff(oldObj, newObj).length > 0;
}
/**
 * Apply a set of diff entries to an object, producing the new version.
 *
 * @param obj - The base object.
 * @param entries - The diff entries to apply.
 * @returns A new object with the diffs applied.
 */
function applyDiff(obj, entries) {
    const result = JSON.parse(JSON.stringify(obj));
    for (const entry of entries) {
        const parts = entry.path.split(".");
        const lastKey = parts.pop();
        let current = result;
        for (const part of parts) {
            if (!(part in current) || typeof current[part] !== "object") {
                current[part] = {};
            }
            current = current[part];
        }
        if (entry.type === "removed") {
            delete current[lastKey];
        }
        else {
            current[lastKey] = entry.newValue;
        }
    }
    return result;
}
//# sourceMappingURL=diff.js.map