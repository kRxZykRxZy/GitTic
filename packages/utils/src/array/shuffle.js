"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shuffleInPlace = shuffleInPlace;
exports.shuffle = shuffle;
exports.sample = sample;
exports.weightedRandom = weightedRandom;
const node_crypto_1 = require("node:crypto");
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
function shuffleInPlace(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = secureRandomIndex(i + 1);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}
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
function shuffle(array) {
    const copy = [...array];
    return shuffleInPlace(copy);
}
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
function sample(array, count) {
    if (count > array.length) {
        throw new RangeError(`Cannot sample ${count} elements from an array of length ${array.length}`);
    }
    if (count <= 0) {
        return [];
    }
    const shuffled = shuffle(array);
    return shuffled.slice(0, count);
}
/**
 * Generate a cryptographically secure random integer in [0, max).
 *
 * @param max - The exclusive upper bound.
 * @returns A random integer from 0 to max-1.
 */
function secureRandomIndex(max) {
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do {
        value = (0, node_crypto_1.randomBytes)(4).readUInt32BE(0);
    } while (value >= limit);
    return value % max;
}
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
function weightedRandom(items) {
    if (items.length === 0) {
        throw new Error("Cannot select from an empty array");
    }
    const totalWeight = items.reduce((sum, [, w]) => sum + w, 0);
    if (totalWeight <= 0) {
        throw new Error("Total weight must be positive");
    }
    const bytes = (0, node_crypto_1.randomBytes)(4);
    const threshold = (bytes.readUInt32BE(0) / 0xffffffff) * totalWeight;
    let cumulative = 0;
    for (const [item, weight] of items) {
        cumulative += weight;
        if (cumulative >= threshold) {
            return item;
        }
    }
    return items[items.length - 1][0];
}
//# sourceMappingURL=shuffle.js.map