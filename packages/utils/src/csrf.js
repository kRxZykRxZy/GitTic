"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCsrfToken = generateCsrfToken;
exports.validateCsrfToken = validateCsrfToken;
const node_crypto_1 = require("node:crypto");
/**
 * Generate a CSRF token.
 */
function generateCsrfToken(secret) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString("hex");
    const hash = (0, node_crypto_1.createHmac)("sha256", secret).update(salt).digest("hex");
    return `${salt}.${hash}`;
}
/**
 * Validate a CSRF token.
 */
function validateCsrfToken(token, secret) {
    const parts = token.split(".");
    if (parts.length !== 2)
        return false;
    const [salt, hash] = parts;
    const expected = (0, node_crypto_1.createHmac)("sha256", secret).update(salt).digest("hex");
    return hash === expected;
}
//# sourceMappingURL=csrf.js.map