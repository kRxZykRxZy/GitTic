"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hash = hash;
exports.hashBuffer = hashBuffer;
exports.verifyHash = verifyHash;
exports.md5 = md5;
exports.sha512 = sha512;
const node_crypto_1 = require("node:crypto");
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
function hash(input, options = {}) {
    const { algorithm = "sha256", encoding = "hex" } = options;
    return (0, node_crypto_1.createHash)(algorithm).update(input, "utf8").digest(encoding);
}
/**
 * Compute a hash digest of a Buffer.
 *
 * @param data - The buffer to hash.
 * @param options - Optional hashing configuration.
 * @returns The encoded hash digest string.
 */
function hashBuffer(data, options = {}) {
    const { algorithm = "sha256", encoding = "hex" } = options;
    return (0, node_crypto_1.createHash)(algorithm).update(data).digest(encoding);
}
/**
 * Verify that a given input matches an expected hash digest.
 *
 * @param input - The original input string.
 * @param expectedHash - The expected hash digest.
 * @param options - Optional hashing configuration.
 * @returns `true` if the computed hash matches the expected hash.
 */
function verifyHash(input, expectedHash, options = {}) {
    const computed = hash(input, options);
    if (computed.length !== expectedHash.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < computed.length; i++) {
        result |= computed.charCodeAt(i) ^ expectedHash.charCodeAt(i);
    }
    return result === 0;
}
/**
 * Compute the MD5 hash of the given input. Useful for checksums, not for security.
 *
 * @param input - The string to hash.
 * @returns The hex-encoded MD5 digest.
 */
function md5(input) {
    return hash(input, { algorithm: "md5" });
}
/**
 * Compute the SHA-512 hash of the given input.
 *
 * @param input - The string to hash.
 * @returns The hex-encoded SHA-512 digest.
 */
function sha512(input) {
    return hash(input, { algorithm: "sha512" });
}
//# sourceMappingURL=hashing.js.map