"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mask = mask;
exports.maskEmail = maskEmail;
exports.maskPhone = maskPhone;
exports.maskCreditCard = maskCreditCard;
exports.maskSecret = maskSecret;
/**
 * Mask a string, replacing characters with a mask character while
 * optionally keeping a number of characters visible at the start and end.
 *
 * @param input - The string to mask.
 * @param options - Optional masking configuration.
 * @returns The masked string.
 *
 * @example
 * ```ts
 * mask("secret-token-12345");
 * // => "*******************"
 *
 * mask("4111111111111111", { keepStart: 4, keepEnd: 4 });
 * // => "4111********1111"
 *
 * mask("user@example.com", { keepEnd: 4, maskChar: "#" });
 * // => "############.com"
 * ```
 */
function mask(input, options = {}) {
    const { maskChar = "*", keepStart = 0, keepEnd = 0 } = options;
    if (input.length === 0) {
        return input;
    }
    const totalKeep = keepStart + keepEnd;
    if (totalKeep >= input.length) {
        return input;
    }
    const maskedLength = input.length - totalKeep;
    const start = input.slice(0, keepStart);
    const end = keepEnd > 0 ? input.slice(-keepEnd) : "";
    const masked = maskChar.repeat(maskedLength);
    return start + masked + end;
}
/**
 * Mask an email address, keeping the first character and domain visible.
 *
 * @param email - The email address to mask.
 * @returns The masked email address.
 *
 * @example
 * ```ts
 * maskEmail("john.doe@example.com");
 * // => "j*******@example.com"
 * ```
 */
function maskEmail(email) {
    const atIndex = email.indexOf("@");
    if (atIndex <= 0) {
        return mask(email);
    }
    const localPart = email.slice(0, atIndex);
    const domain = email.slice(atIndex);
    if (localPart.length <= 1) {
        return localPart + domain;
    }
    const maskedLocal = localPart[0] + "*".repeat(localPart.length - 1);
    return maskedLocal + domain;
}
/**
 * Mask a phone number, keeping the last 4 digits visible.
 *
 * @param phone - The phone number to mask.
 * @returns The masked phone number.
 *
 * @example
 * ```ts
 * maskPhone("+1-555-123-4567");
 * // => "***********4567"
 * ```
 */
function maskPhone(phone) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length <= 4) {
        return phone;
    }
    return "*".repeat(digits.length - 4) + digits.slice(-4);
}
/**
 * Mask a credit card number, keeping the first 4 and last 4 digits visible.
 *
 * @param cardNumber - The card number (digits and optional spaces/dashes).
 * @returns The masked card number.
 *
 * @example
 * ```ts
 * maskCreditCard("4111 1111 1111 1111");
 * // => "4111********1111"
 * ```
 */
function maskCreditCard(cardNumber) {
    const digits = cardNumber.replace(/\D/g, "");
    return mask(digits, { keepStart: 4, keepEnd: 4 });
}
/**
 * Mask a generic secret/API key, showing only a prefix.
 *
 * @param secret - The secret string.
 * @param visibleChars - Number of characters to show. Defaults to 4.
 * @returns The masked secret.
 */
function maskSecret(secret, visibleChars = 4) {
    if (secret.length <= visibleChars) {
        return "*".repeat(secret.length);
    }
    return secret.slice(0, visibleChars) + "*".repeat(secret.length - visibleChars);
}
//# sourceMappingURL=mask.js.map