"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.isTokenExpired = isTokenExpired;
exports.createSignedToken = createSignedToken;
exports.verifySignedToken = verifySignedToken;
exports.generateOTP = generateOTP;
const node_crypto_1 = require("node:crypto");
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
function generateToken(options = {}) {
    const { byteLength = 32, prefix = "", expiresInMs } = options;
    const raw = (0, node_crypto_1.randomBytes)(byteLength).toString("base64url");
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
function isTokenExpired(tokenResult) {
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
function createSignedToken(payload, secret) {
    const signature = (0, node_crypto_1.createHmac)("sha256", secret)
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
function verifySignedToken(signedToken, secret) {
    const dotIndex = signedToken.lastIndexOf(".");
    if (dotIndex === -1) {
        return null;
    }
    const payload = signedToken.slice(0, dotIndex);
    const signature = signedToken.slice(dotIndex + 1);
    const expected = (0, node_crypto_1.createHmac)("sha256", secret)
        .update(payload, "utf8")
        .digest("base64url");
    if (expected.length !== signature.length) {
        return null;
    }
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (!(0, node_crypto_1.timingSafeEqual)(a, b)) {
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
function generateOTP(length = 6) {
    const max = Math.pow(10, length);
    const limit = Math.floor(0x100000000 / max) * max;
    let value;
    do {
        value = (0, node_crypto_1.randomBytes)(4).readUInt32BE(0);
    } while (value >= limit);
    const num = value % max;
    return num.toString().padStart(length, "0");
}
//# sourceMappingURL=tokens.js.map