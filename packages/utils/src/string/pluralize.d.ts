/**
 * Convert a singular English word to its plural form.
 *
 * @param word - The singular word.
 * @returns The pluralized word.
 *
 * @example
 * ```ts
 * pluralize("cat");   // => "cats"
 * pluralize("baby");  // => "babies"
 * pluralize("child"); // => "children"
 * ```
 */
export declare function pluralize(word: string): string;
/**
 * Return the singular or plural form of a word based on a count.
 *
 * @param word - The singular form of the word.
 * @param count - The count to determine singularity or plurality.
 * @param pluralForm - An explicit plural form. If omitted, `pluralize()` is used.
 * @returns The appropriate form of the word.
 *
 * @example
 * ```ts
 * pluralizeCount("item", 1);  // => "1 item"
 * pluralizeCount("item", 5);  // => "5 items"
 * pluralizeCount("child", 3); // => "3 children"
 * ```
 */
export declare function pluralizeCount(word: string, count: number, pluralForm?: string): string;
/**
 * Check if a word is likely already in plural form.
 * This is a heuristic and may not be accurate for all words.
 *
 * @param word - The word to check.
 * @returns `true` if the word appears to be plural.
 */
export declare function isPlural(word: string): boolean;
//# sourceMappingURL=pluralize.d.ts.map