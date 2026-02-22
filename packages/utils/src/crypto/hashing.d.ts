import { type BinaryToTextEncoding } from "node:crypto";
/**
 * Supported hash algorithms.
 */
export type HashAlgorithm = "sha256" | "sha512" | "sha1" | "md5";
/**
 * Options for hashing operations.
 */
export interface HashOptions {
    /** The hash algorithm to use. Defaults to "sha256". */
    algorithm?: HashAlgorithm;
    /** The output encoding. Defaults to "hex". */
    encoding?: BinaryToTextEncoding;
}
/**
 * Compute a hash digest of the given input string.
 *
 * @param input - The string to hash.
 * @param options - Optional hashing configuration.
 * @returns The hex-encoded (or otherwise encoded) hash digest.
 *
 * @example
 * ```ts
 * const digest = hash("hello world");
 * // => "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9"
 * ```
 */
export declare function hash(input: string, options?: HashOptions): string;
/**
 * Compute a hash digest of a Buffer.
 *
 * @param data - The buffer to hash.
 * @param options - Optional hashing configuration.
 * @returns The encoded hash digest string.
 */
export declare function hashBuffer(data: Buffer, options?: HashOptions): string;
/**
 * Verify that a given input matches an expected hash digest.
 *
 * @param input - The original input string.
 * @param expectedHash - The expected hash digest.
 * @param options - Optional hashing configuration.
 * @returns `true` if the computed hash matches the expected hash.
 */
export declare function verifyHash(input: string, expectedHash: string, options?: HashOptions): boolean;
/**
 * Compute the MD5 hash of the given input. Useful for checksums, not for security.
 *
 * @param input - The string to hash.
 * @returns The hex-encoded MD5 digest.
 */
export declare function md5(input: string): string;
/**
 * Compute the SHA-512 hash of the given input.
 *
 * @param input - The string to hash.
 * @returns The hex-encoded SHA-512 digest.
 */
export declare function sha512(input: string): string;
//# sourceMappingURL=hashing.d.ts.map