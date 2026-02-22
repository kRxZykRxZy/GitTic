/**
 * Encryption configuration options.
 */
export interface EncryptionOptions {
    /** The encryption algorithm. Defaults to "aes-256-gcm". */
    algorithm?: string;
    /** Length of the initialization vector in bytes. Defaults to 16. */
    ivLength?: number;
    /** Length of the authentication tag in bytes (for GCM). Defaults to 16. */
    authTagLength?: number;
}
/**
 * Result of an encryption operation, containing all data needed for decryption.
 */
export interface EncryptedPayload {
    /** The encrypted data, hex-encoded. */
    ciphertext: string;
    /** The initialization vector, hex-encoded. */
    iv: string;
    /** The authentication tag, hex-encoded (GCM only). */
    authTag: string;
    /** The salt used for key derivation, hex-encoded. */
    salt: string;
}
/**
 * Derive an encryption key from a password using scrypt.
 *
 * @param password - The password to derive the key from.
 * @param salt - The salt buffer.
 * @param keyLength - Desired key length in bytes. Defaults to 32.
 * @returns The derived key as a Buffer.
 */
export declare function deriveKey(password: string, salt: Buffer, keyLength?: number): Buffer;
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
export declare function encrypt(plaintext: string, password: string, options?: EncryptionOptions): EncryptedPayload;
/**
 * Decrypt an encrypted payload using AES-256-GCM with the original password.
 *
 * @param payload - The encrypted payload object.
 * @param password - The password used during encryption.
 * @returns The decrypted plaintext string.
 * @throws If decryption fails due to wrong password or tampered data.
 */
export declare function decrypt(payload: EncryptedPayload, password: string): string;
//# sourceMappingURL=encryption.d.ts.map