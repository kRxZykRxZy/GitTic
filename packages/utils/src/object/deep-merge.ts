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
 * Check if a value is a plain object.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
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
export function deepMerge<
  T extends Record<string, unknown>,
  U extends Record<string, unknown>,
>(target: T, source: U, options: DeepMergeOptions = {}): T & U {
  const { mergeArrays = false, maxDepth = Infinity } = options;
  return mergeRecursive(target, source, mergeArrays, maxDepth, 0) as T & U;
}

/**
 * Internal recursive merge implementation.
 */
function mergeRecursive(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  mergeArrays: boolean,
  maxDepth: number,
  currentDepth: number,
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (
      currentDepth < maxDepth &&
      isPlainObject(targetVal) &&
      isPlainObject(sourceVal)
    ) {
      result[key] = mergeRecursive(
        targetVal,
        sourceVal,
        mergeArrays,
        maxDepth,
        currentDepth + 1,
      );
    } else if (
      mergeArrays &&
      Array.isArray(targetVal) &&
      Array.isArray(sourceVal)
    ) {
      result[key] = [...targetVal, ...sourceVal];
    } else {
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
export function deepMergeAll(
  objects: ReadonlyArray<Record<string, unknown>>,
  options: DeepMergeOptions = {},
): Record<string, unknown> {
  if (objects.length === 0) {
    return {};
  }

  let result: Record<string, unknown> = {};
  for (const obj of objects) {
    result = deepMerge(result, obj, options);
  }
  return result;
}
