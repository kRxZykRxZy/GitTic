/**
 * Options for the slugify function.
 */
export interface SlugifyOptions {
    /** The separator to use between words. Defaults to "-". */
    separator?: string;
    /** Whether to convert to lowercase. Defaults to true. */
    lowercase?: boolean;
    /** Maximum length of the slug. No limit if undefined. */
    maxLength?: number;
    /** Whether to transliterate common accented characters. Defaults to true. */
    transliterate?: boolean;
}
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
export declare function slugify(input: string, options?: SlugifyOptions): string;
//# sourceMappingURL=slugify.d.ts.map