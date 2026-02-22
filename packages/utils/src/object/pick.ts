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
export function pick<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  keys: readonly K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
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
export function pickBy<T extends Record<string, unknown>>(
  obj: T,
  predicate: (key: string, value: unknown) => boolean,
): Partial<T> {
  const result: Partial<T> = {};
  for (const key of Object.keys(obj)) {
    if (predicate(key, obj[key])) {
      (result as Record<string, unknown>)[key] = obj[key];
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
export function pickDeep(
  obj: Record<string, unknown>,
  paths: readonly string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

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
function getNestedValue(
  obj: Record<string, unknown>,
  keys: string[],
): unknown {
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Set a nested value in an object by an array of keys.
 */
function setNestedValue(
  obj: Record<string, unknown>,
  keys: string[],
  value: unknown,
): void {
  let current = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current) || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  current[keys[keys.length - 1]!] = value;
}
