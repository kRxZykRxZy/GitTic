/**
 * Options for string truncation.
 */
export interface TruncateOptions {
    /** Maximum length of the output string (including suffix). Defaults to 100. */
    maxLength?: number;
    /** The suffix to append when truncating. Defaults to "…". */
    suffix?: string;
    /** Whether to break at the nearest word boundary. Defaults to true. */
    wordBoundary?: boolean;
}
/**
 * Truncate a string to a maximum length, appending a suffix if truncated.
 *
 * @param input - The string to truncate.
 * @param options - Optional truncation configuration.
 * @returns The truncated string, or the original string if it is already
 *   within the maximum length.
 *
 * @example
 * ```ts
 * truncate("Hello, this is a long sentence.", { maxLength: 20 });
 * // => "Hello, this is a…"
 * ```
 */
export declare function truncate(input: string, options?: TruncateOptions): string;
/**
 * Truncate a string from the middle, preserving the start and end.
 *
 * @param input - The string to truncate.
 * @param maxLength - Maximum total length. Defaults to 50.
 * @param separator - The string to insert in the middle. Defaults to "…".
 * @returns The truncated string.
 *
 * @example
 * ```ts
 * truncateMiddle("abcdefghij", 7);
 * // => "abc…hij"
 * ```
 */
export declare function truncateMiddle(input: string, maxLength?: number, separator?: string): string;
/**
 * Truncate a file path, preserving the filename and collapsing
 * intermediate directories.
 *
 * @param filePath - The path to truncate.
 * @param maxLength - Maximum length. Defaults to 40.
 * @returns The truncated path.
 *
 * @example
 * ```ts
 * truncatePath("/very/long/nested/path/to/file.ts", 25);
 * // => "/very/…/to/file.ts"
 * ```
 */
export declare function truncatePath(filePath: string, maxLength?: number): string;
//# sourceMappingURL=truncate.d.ts.map