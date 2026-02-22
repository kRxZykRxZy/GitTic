/**
 * Supported HMAC hash algorithms.
 */
export type HmacAlgorithm = "sha256" | "sha512" | "sha1";
/**
 * Options for HMAC operations.
 */
export interface HmacOptions {
    /** The hash algorithm. Defaults to "sha256". */
    algorithm?: HmacAlgorithm;
    /** The output encoding. Defaults to "hex". */
    encoding?: "hex" | "base64" | "base64url";
}
/**
 * Create an HMAC signature for the given data.
 *
 * @param data - The data to sign.
 * @param secret - The secret key.
 * @param options - Optional HMAC configuration.
 * @returns The HMAC signature string.
 *
 * @example
 * ```ts
 * const sig = hmacSign("payload", "my-secret");
 * ```
 */
export declare function hmacSign(data: string, secret: string, options?: HmacOptions): string;
/**
 * Verify that an HMAC signature matches the expected value, using
 * constant-time comparison to prevent timing attacks.
 *
 * @param data - The original data.
 * @param signature - The signature to verify.
 * @param secret - The secret key used to create the signature.
 * @param options - Optional HMAC configuration.
 * @returns `true` if the signature is valid.
 */
export declare function hmacVerify(data: string, signature: string, secret: string, options?: HmacOptions): boolean;
/**
 * Sign a webhook payload with a secret and return the signature header value.
 *
 * @param payload - The raw webhook body as a string.
 * @param secret - The webhook secret.
 * @param prefix - An optional prefix for the signature (e.g., "sha256=").
 *   Defaults to "sha256=".
 * @returns The full signature string including the prefix.
 *
 * @example
 * ```ts
 * const header = signWebhookPayload(body, secret);
 * // => "sha256=abc123..."
 * ```
 */
export declare function signWebhookPayload(payload: string, secret: string, prefix?: string): string;
/**
 * Verify a webhook payload signature.
 *
 * @param payload - The raw webhook body.
 * @param signatureHeader - The full signature header value (with prefix).
 * @param secret - The webhook secret.
 * @param prefix - The prefix to strip before comparison. Defaults to "sha256=".
 * @returns `true` if the signature is valid.
 */
export declare function verifyWebhookPayload(payload: string, signatureHeader: string, secret: string, prefix?: string): boolean;
//# sourceMappingURL=hmac.d.ts.map