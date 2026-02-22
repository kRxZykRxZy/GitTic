"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.slugify = slugify;
/**
 * Map of common accented characters to their ASCII equivalents.
 */
const TRANSLITERATION_MAP = {
    à: "a", á: "a", â: "a", ã: "a", ä: "a", å: "a",
    è: "e", é: "e", ê: "e", ë: "e",
    ì: "i", í: "i", î: "i", ï: "i",
    ò: "o", ó: "o", ô: "o", õ: "o", ö: "o",
    ù: "u", ú: "u", û: "u", ü: "u",
    ñ: "n", ç: "c", ß: "ss", ø: "o", æ: "ae",
    À: "A", Á: "A", Â: "A", Ã: "A", Ä: "A", Å: "A",
    È: "E", É: "E", Ê: "E", Ë: "E",
    Ì: "I", Í: "I", Î: "I", Ï: "I",
    Ò: "O", Ó: "O", Ô: "O", Õ: "O", Ö: "O",
    Ù: "U", Ú: "U", Û: "U", Ü: "U",
    Ñ: "N", Ç: "C", Ø: "O", Æ: "AE",
};
/**
 * Convert a string into a URL-friendly slug.
 *
 * @param input - The string to slugify.
 * @param options - Optional slugify configuration.
 * @returns A URL-safe slug string.
 *
 * @example
 * ```ts
 * slugify("Hello World!"); // => "hello-world"
 * slugify("Crème Brûlée"); // => "creme-brulee"
 * slugify("foo bar", { separator: "_" }); // => "foo_bar"
 * ```
 */
function slugify(input, options = {}) {
    const { separator = "-", lowercase = true, maxLength, transliterate = true, } = options;
    let result = input;
    if (transliterate) {
        result = result
            .split("")
            .map((char) => TRANSLITERATION_MAP[char] ?? char)
            .join("");
    }
    if (lowercase) {
        result = result.toLowerCase();
    }
    // Replace non-alphanumeric characters with the separator
    result = result.replace(/[^a-zA-Z0-9]+/g, separator);
    // Remove leading/trailing separators
    result = result.replace(new RegExp(`^${escapeRegExp(separator)}+|${escapeRegExp(separator)}+$`, "g"), "");
    // Truncate to max length, avoiding cutting in the middle of a word
    if (maxLength != null && result.length > maxLength) {
        result = result.slice(0, maxLength);
        const lastSep = result.lastIndexOf(separator);
        if (lastSep > 0) {
            result = result.slice(0, lastSep);
        }
    }
    return result;
}
/**
 * Escape special regex characters in a string.
 *
 * @param str - The string to escape.
 * @returns The escaped string safe for use in a RegExp.
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=slugify.js.map