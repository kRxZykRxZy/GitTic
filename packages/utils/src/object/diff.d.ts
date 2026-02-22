/**
 * Represents a single difference between two objects.
 */
export interface DiffEntry {
    /** Dot-separated path to the changed property. */
    path: string;
    /** The type of change. */
    type: "added" | "removed" | "changed";
    /** The value in the old/left object (undefined for "added"). */
    oldValue?: unknown;
    /** The value in the new/right object (undefined for "removed"). */
    newValue?: unknown;
}
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
export declare function diff(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): DiffEntry[];
/**
 * Check whether two objects have any differences.
 *
 * @param oldObj - The old/left object.
 * @param newObj - The new/right object.
 * @returns `true` if the objects differ.
 */
export declare function hasDiff(oldObj: Record<string, unknown>, newObj: Record<string, unknown>): boolean;
/**
 * Apply a set of diff entries to an object, producing the new version.
 *
 * @param obj - The base object.
 * @param entries - The diff entries to apply.
 * @returns A new object with the diffs applied.
 */
export declare function applyDiff(obj: Record<string, unknown>, entries: readonly DiffEntry[]): Record<string, unknown>;
//# sourceMappingURL=diff.d.ts.map