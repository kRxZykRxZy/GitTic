import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";

/**
 * Configuration options for token generation.
 */
export interface TokenOptions {
  /** Length of the token in bytes before encoding. Defaults to 32. */
  byteLength?: number;
  /** Optional prefix to prepend to the token (e.g., "ghp_"). */
  prefix?: string;
  /** Expiration time in milliseconds from now. */
  expiresInMs?: number;
}

/**
 * A generated token with its metadata.
 */
export interface TokenResult {
  /** The full token string (prefix + encoded random bytes). */
  token: string;
  /** Unix timestamp (ms) when the token was created. */
  createdAt: number;
  /** Unix timestamp (ms) when the token expires, or null if no expiry. */
  expiresAt: number | null;
}

/**
 * Generate a secure random token suitable for API keys or session tokens.
 *
 * @param options - Optional token configuration.
 * @returns A token result containing the token string and metadata.
 *
 * @example
 * ```ts
 * const { token, expiresAt } = generateToken({ prefix: "sk_", expiresInMs: 3600000 });
 * // token => "sk_a3f9c1b2e4d5..."
 * ```
 */
export function generateToken(options: TokenOptions = {}): TokenResult {
  const { byteLength = 32, prefix = "", expiresInMs } = options;
  const raw = randomBytes(byteLength).toString("base64url");
  const now = Date.now();

  return {
    token: `${prefix}${raw}`,
    createdAt: now,
    expiresAt: expiresInMs != null ? now + expiresInMs : null,
  };
}

/**
 * Check if a token result has expired.
 *
 * @param tokenResult - The token result to check.
 * @returns `true` if the token has an expiry time and it has passed.
 */
export function isTokenExpired(tokenResult: TokenResult): boolean {
  if (tokenResult.expiresAt === null) {
    return false;
  }
  return Date.now() > tokenResult.expiresAt;
}

/**
 * Create a signed token by appending an HMAC signature.
 * The returned string format is `<payload>.<signature>`.
 *
 * @param payload - The payload string to sign.
 * @param secret - The secret key for signing.
 * @returns The signed token string.
 */
export function createSignedToken(payload: string, secret: string): string {
  const signature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");
  return `${payload}.${signature}`;
}

/**
 * Verify a signed token and extract its payload.
 *
 * @param signedToken - The signed token string (payload.signature).
 * @param secret - The secret key used during creation.
 * @returns The payload string if the signature is valid, or `null` if invalid.
 */
export function verifySignedToken(
  signedToken: string,
  secret: string,
): string | null {
  const dotIndex = signedToken.lastIndexOf(".");
  if (dotIndex === -1) {
    return null;
  }

  const payload = signedToken.slice(0, dotIndex);
  const signature = signedToken.slice(dotIndex + 1);

  const expected = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");

  if (expected.length !== signature.length) {
    return null;
  }

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");

  if (!timingSafeEqual(a, b)) {
    return null;
  }

  return payload;
}

/**
 * Generate a one-time password (OTP) as a numeric string.
 *
 * @param length - The number of digits. Defaults to 6.
 * @returns A numeric OTP string, zero-padded to the requested length.
 */
export function generateOTP(length: number = 6): string {
  const max = Math.pow(10, length);
  const limit = Math.floor(0x100000000 / max) * max;
  let value: number;
  do {
    value = randomBytes(4).readUInt32BE(0);
  } while (value >= limit);
  const num = value % max;
  return num.toString().padStart(length, "0");
}
