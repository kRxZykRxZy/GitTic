"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deriveKey = deriveKey;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
const node_crypto_1 = require("node:crypto");
/**
 * Derive an encryption key from a password using scrypt.
 *
 * @param password - The password to derive the key from.
 * @param salt - The salt buffer.
 * @param keyLength - Desired key length in bytes. Defaults to 32.
 * @returns The derived key as a Buffer.
 */
function deriveKey(password, salt, keyLength = 32) {
    return (0, node_crypto_1.scryptSync)(password, salt, keyLength);
}
/**
 * Encrypt a plaintext string using AES-256-GCM with a password.
 *
 * @param plaintext - The text to encrypt.
 * @param password - The password used for key derivation.
 * @param options - Optional encryption configuration.
 * @returns An object containing the ciphertext, IV, auth tag, and salt.
 *
 * @example
 * ```ts
 * const result = encrypt("secret message", "my-password");
 * // result.ciphertext, result.iv, result.authTag, result.salt
 * ```
 */
function encrypt(plaintext, password, options = {}) {
    const { ivLength = 16, authTagLength = 16 } = options;
    const salt = (0, node_crypto_1.randomBytes)(32);
    const key = deriveKey(password, salt);
    const iv = (0, node_crypto_1.randomBytes)(ivLength);
    const cipher = (0, node_crypto_1.createCipheriv)("aes-256-gcm", key, iv, {
        authTagLength,
    });
    let ciphertext = cipher.update(plaintext, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return {
        ciphertext,
        iv: iv.toString("hex"),
        authTag,
        salt: salt.toString("hex"),
    };
}
/**
 * Decrypt an encrypted payload using AES-256-GCM with the original password.
 *
 * @param payload - The encrypted payload object.
 * @param password - The password used during encryption.
 * @returns The decrypted plaintext string.
 * @throws If decryption fails due to wrong password or tampered data.
 */
function decrypt(payload, password) {
    const salt = Buffer.from(payload.salt, "hex");
    const iv = Buffer.from(payload.iv, "hex");
    const authTag = Buffer.from(payload.authTag, "hex");
    const key = deriveKey(password, salt);
    const decipher = (0, node_crypto_1.createDecipheriv)("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let plaintext = decipher.update(payload.ciphertext, "hex", "utf8");
    plaintext += decipher.final("utf8");
    return plaintext;
}
//# sourceMappingURL=encryption.js.map