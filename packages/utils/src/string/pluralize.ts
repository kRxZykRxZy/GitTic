/**
 * A map of common irregular plural forms.
 */
const IRREGULARS: ReadonlyMap<string, string> = new Map([
  ["child", "children"],
  ["person", "people"],
  ["man", "men"],
  ["woman", "women"],
  ["mouse", "mice"],
  ["goose", "geese"],
  ["tooth", "teeth"],
  ["foot", "feet"],
  ["ox", "oxen"],
  ["leaf", "leaves"],
  ["life", "lives"],
  ["knife", "knives"],
  ["wife", "wives"],
  ["half", "halves"],
  ["self", "selves"],
  ["calf", "calves"],
]);

/**
 * Rules for regular plural forms, applied in order.
 * Each tuple is [regex to match singular, replacement for plural].
 */
const PLURAL_RULES: ReadonlyArray<[RegExp, string]> = [
  [/s$/i, "ses"],
  [/([^aeiou])y$/i, "$1ies"],
  [/(x|ch|ss|sh)$/i, "$1es"],
  [/(f|fe)$/i, "ves"],
  [/([^s])$/i, "$1s"],
];

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
export function pluralize(word: string): string {
  if (word.length === 0) {
    return word;
  }

  const lower = word.toLowerCase();
  const irregular = IRREGULARS.get(lower);
  if (irregular) {
    // Preserve original casing of the first character
    if (word[0] === word[0]!.toUpperCase()) {
      return irregular.charAt(0).toUpperCase() + irregular.slice(1);
    }
    return irregular;
  }

  for (const [pattern, replacement] of PLURAL_RULES) {
    if (pattern.test(word)) {
      return word.replace(pattern, replacement);
    }
  }

  return word + "s";
}

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
export function pluralizeCount(
  word: string,
  count: number,
  pluralForm?: string,
): string {
  const form =
    Math.abs(count) === 1 ? word : (pluralForm ?? pluralize(word));
  return `${count} ${form}`;
}

/**
 * Check if a word is likely already in plural form.
 * This is a heuristic and may not be accurate for all words.
 *
 * @param word - The word to check.
 * @returns `true` if the word appears to be plural.
 */
export function isPlural(word: string): boolean {
  const lower = word.toLowerCase();

  // Check reverse irregulars
  for (const [, plural] of IRREGULARS) {
    if (lower === plural) {
      return true;
    }
  }

  // Simple heuristic: ends with "s" but not "ss"
  if (lower.endsWith("s") && !lower.endsWith("ss")) {
    return true;
  }

  return false;
}
