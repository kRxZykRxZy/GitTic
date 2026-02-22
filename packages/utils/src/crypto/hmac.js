"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hmacSign = hmacSign;
exports.hmacVerify = hmacVerify;
exports.signWebhookPayload = signWebhookPayload;
exports.verifyWebhookPayload = verifyWebhookPayload;
const node_crypto_1 = require("node:crypto");
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
function hmacSign(data, secret, options = {}) {
    const { algorithm = "sha256", encoding = "hex" } = options;
    return (0, node_crypto_1.createHmac)(algorithm, secret).update(data, "utf8").digest(encoding);
}
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
function hmacVerify(data, signature, secret, options = {}) {
    const expected = hmacSign(data, secret, options);
    if (expected.length !== signature.length) {
        return false;
    }
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    return (0, node_crypto_1.timingSafeEqual)(a, b);
}
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
function signWebhookPayload(payload, secret, prefix = "sha256=") {
    const signature = hmacSign(payload, secret, { algorithm: "sha256" });
    return `${prefix}${signature}`;
}
/**
 * Verify a webhook payload signature.
 *
 * @param payload - The raw webhook body.
 * @param signatureHeader - The full signature header value (with prefix).
 * @param secret - The webhook secret.
 * @param prefix - The prefix to strip before comparison. Defaults to "sha256=".
 * @returns `true` if the signature is valid.
 */
function verifyWebhookPayload(payload, signatureHeader, secret, prefix = "sha256=") {
    if (!signatureHeader.startsWith(prefix)) {
        return false;
    }
    const signature = signatureHeader.slice(prefix.length);
    return hmacVerify(payload, signature, secret, { algorithm: "sha256" });
}
//# sourceMappingURL=hmac.js.map