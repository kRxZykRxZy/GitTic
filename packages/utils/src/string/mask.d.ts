/**
 * Options for masking strings.
 */
export interface MaskOptions {
    /** The character to use for masking. Defaults to "*". */
    maskChar?: string;
    /** Number of characters to keep visible at the start. Defaults to 0. */
    keepStart?: number;
    /** Number of characters to keep visible at the end. Defaults to 0. */
    keepEnd?: number;
}
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
export declare function mask(input: string, options?: MaskOptions): string;
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
export declare function maskEmail(email: string): string;
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
export declare function maskPhone(phone: string): string;
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
export declare function maskCreditCard(cardNumber: string): string;
/**
 * Mask a generic secret/API key, showing only a prefix.
 *
 * @param secret - The secret string.
 * @param visibleChars - Number of characters to show. Defaults to 4.
 * @returns The masked secret.
 */
export declare function maskSecret(secret: string, visibleChars?: number): string;
//# sourceMappingURL=mask.d.ts.map