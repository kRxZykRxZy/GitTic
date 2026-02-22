/**
 * Shuffle an array in place using the Fisher-Yates algorithm with
 * cryptographically secure random numbers.
 *
 * @param array - The array to shuffle. This mutates the array in place.
 * @returns The same array, shuffled.
 *
 * @example
 * ```ts
 * const arr = [1, 2, 3, 4, 5];
 * shuffleInPlace(arr);
 * // arr is now in a random order
 * ```
 */
export declare function shuffleInPlace<T>(array: T[]): T[];
/**
 * Create a new shuffled copy of an array without mutating the original.
 *
 * @param array - The array to shuffle.
 * @returns A new array with elements in random order.
 *
 * @example
 * ```ts
 * const original = [1, 2, 3, 4, 5];
 * const shuffled = shuffle(original);
 * // original is unchanged, shuffled is in random order
 * ```
 */
export declare function shuffle<T>(array: readonly T[]): T[];
/**
 * Pick a random sample of elements from an array without replacement.
 *
 * @param array - The source array.
 * @param count - The number of elements to sample.
 * @returns A new array containing `count` random elements.
 * @throws If count is larger than the array length.
 *
 * @example
 * ```ts
 * sample([1, 2, 3, 4, 5], 3);
 * // => e.g., [3, 1, 5]
 * ```
 */
export declare function sample<T>(array: readonly T[], count: number): T[];
/**
 * Weighted random selection from an array.
 * Each element is paired with a numeric weight.
 *
 * @param items - An array of [element, weight] tuples.
 * @returns The randomly selected element.
 * @throws If items is empty or all weights are zero.
 *
 * @example
 * ```ts
 * weightedRandom([["a", 10], ["b", 1]]);
 * // "a" is 10x more likely than "b"
 * ```
 */
export declare function weightedRandom<T>(items: ReadonlyArray<[T, number]>): T;
//# sourceMappingURL=shuffle.d.ts.map