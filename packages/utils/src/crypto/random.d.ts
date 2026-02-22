/**
 * Generate a cryptographically secure random hex string.
 *
 * @param byteLength - Number of random bytes to generate. The hex string
 *   will be twice this length. Defaults to 32.
 * @returns A hex-encoded random string.
 *
 * @example
 * ```ts
 * const id = randomHex(16);
 * // => "a3f9c1b2e4d5f6a7b8c9d0e1f2a3b4c5"
 * ```
 */
export declare function randomHex(byteLength?: number): string;
/**
 * Generate a cryptographically secure random Base64 URL-safe string.
 *
 * @param byteLength - Number of random bytes. Defaults to 32.
 * @returns A Base64 URL-safe encoded string (no padding).
 */
export declare function randomBase64Url(byteLength?: number): string;
/**
 * Generate a random integer within a given range (inclusive).
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A cryptographically secure random integer in [min, max].
 * @throws If min >= max.
 */
export declare function randomInteger(min: number, max: number): number;
/**
 * Generate a random string from a given alphabet/charset.
 *
 * @param length - The desired length of the output string.
 * @param charset - The characters to choose from.
 *   Defaults to alphanumeric characters.
 * @returns A random string of the specified length.
 *
 * @example
 * ```ts
 * const code = randomString(6, "0123456789");
 * // => "483921"
 * ```
 */
export declare function randomString(length: number, charset?: string): string;
/**
 * Generate a UUID v4 string using cryptographically secure random bytes.
 *
 * @returns A UUID v4 string in the form "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
 */
export declare function randomUUID(): string;
/**
 * Pick a random element from an array using a secure random index.
 *
 * @param items - The array to pick from.
 * @returns A randomly selected element, or undefined if the array is empty.
 */
export declare function randomPick<T>(items: readonly T[]): T | undefined;
//# sourceMappingURL=random.d.ts.map