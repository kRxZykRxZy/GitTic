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
export declare function generateToken(options?: TokenOptions): TokenResult;
/**
 * Check if a token result has expired.
 *
 * @param tokenResult - The token result to check.
 * @returns `true` if the token has an expiry time and it has passed.
 */
export declare function isTokenExpired(tokenResult: TokenResult): boolean;
/**
 * Create a signed token by appending an HMAC signature.
 * The returned string format is `<payload>.<signature>`.
 *
 * @param payload - The payload string to sign.
 * @param secret - The secret key for signing.
 * @returns The signed token string.
 */
export declare function createSignedToken(payload: string, secret: string): string;
/**
 * Verify a signed token and extract its payload.
 *
 * @param signedToken - The signed token string (payload.signature).
 * @param secret - The secret key used during creation.
 * @returns The payload string if the signature is valid, or `null` if invalid.
 */
export declare function verifySignedToken(signedToken: string, secret: string): string | null;
/**
 * Generate a one-time password (OTP) as a numeric string.
 *
 * @param length - The number of digits. Defaults to 6.
 * @returns A numeric OTP string, zero-padded to the requested length.
 */
export declare function generateOTP(length?: number): string;
//# sourceMappingURL=tokens.d.ts.map