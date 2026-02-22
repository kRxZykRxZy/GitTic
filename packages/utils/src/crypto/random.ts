import { randomBytes, randomInt as cryptoRandomInt } from "node:crypto";

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
export function randomHex(byteLength: number = 32): string {
  return randomBytes(byteLength).toString("hex");
}

/**
 * Generate a cryptographically secure random Base64 URL-safe string.
 *
 * @param byteLength - Number of random bytes. Defaults to 32.
 * @returns A Base64 URL-safe encoded string (no padding).
 */
export function randomBase64Url(byteLength: number = 32): string {
  return randomBytes(byteLength)
    .toString("base64url")
    .replace(/=+$/, "");
}

/**
 * Generate a random integer within a given range (inclusive).
 *
 * @param min - The minimum value (inclusive).
 * @param max - The maximum value (inclusive).
 * @returns A cryptographically secure random integer in [min, max].
 * @throws If min >= max.
 */
export function randomInteger(min: number, max: number): number {
  if (min >= max) {
    throw new RangeError(
      `min (${min}) must be strictly less than max (${max})`,
    );
  }
  return cryptoRandomInt(min, max + 1);
}

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
export function randomString(
  length: number,
  charset: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
): string {
  if (length <= 0) {
    return "";
  }
  if (charset.length === 0) {
    throw new Error("charset must not be empty");
  }

  const limit = Math.floor(256 / charset.length) * charset.length;
  const result: string[] = new Array(length);
  let filled = 0;
  while (filled < length) {
    const bytes = randomBytes(length - filled);
    for (let i = 0; i < bytes.length && filled < length; i++) {
      if (bytes[i]! < limit) {
        result[filled] = charset[bytes[i]! % charset.length]!;
        filled++;
      }
    }
  }
  return result.join("");
}

/**
 * Generate a UUID v4 string using cryptographically secure random bytes.
 *
 * @returns A UUID v4 string in the form "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".
 */
export function randomUUID(): string {
  const bytes = randomBytes(16);
  // Set version (4) and variant (RFC 4122)
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;

  const hex = bytes.toString("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

/**
 * Pick a random element from an array using a secure random index.
 *
 * @param items - The array to pick from.
 * @returns A randomly selected element, or undefined if the array is empty.
 */
export function randomPick<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  const index = cryptoRandomInt(0, items.length);
  return items[index];
}
