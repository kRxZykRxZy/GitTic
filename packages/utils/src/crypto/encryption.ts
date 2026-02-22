import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from "node:crypto";

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
export function deriveKey(
  password: string,
  salt: Buffer,
  keyLength: number = 32,
): Buffer {
  return scryptSync(password, salt, keyLength);
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
export function encrypt(
  plaintext: string,
  password: string,
  options: EncryptionOptions = {},
): EncryptedPayload {
  const { ivLength = 16, authTagLength = 16 } = options;

  const salt = randomBytes(32);
  const key = deriveKey(password, salt);
  const iv = randomBytes(ivLength);

  const cipher = createCipheriv("aes-256-gcm", key, iv, {
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
export function decrypt(payload: EncryptedPayload, password: string): string {
  const salt = Buffer.from(payload.salt, "hex");
  const iv = Buffer.from(payload.iv, "hex");
  const authTag = Buffer.from(payload.authTag, "hex");
  const key = deriveKey(password, salt);

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let plaintext = decipher.update(payload.ciphertext, "hex", "utf8");
  plaintext += decipher.final("utf8");

  return plaintext;
}
