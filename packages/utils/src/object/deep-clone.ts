/**
 * Check if a value is a plain object (not an array, Date, RegExp, etc.).
 *
 * @param value - The value to check.
 * @returns `true` if the value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
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
export function deepClone<T>(value: T): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    for (const [k, v] of value) {
      clonedMap.set(deepClone(k), deepClone(v));
    }
    return clonedMap as unknown as T;
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    for (const v of value) {
      clonedSet.add(deepClone(v));
    }
    return clonedSet as unknown as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClone(item)) as unknown as T;
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(value)) {
      result[key] = deepClone((value as Record<string, unknown>)[key]);
    }
    return result as T;
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
export function deepFreeze<T extends Record<string, unknown>>(obj: T): Readonly<T> {
  Object.freeze(obj);
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== null && typeof val === "object" && !Object.isFrozen(val)) {
      deepFreeze(val as Record<string, unknown>);
    }
  }
  return obj;
}
