/**
 * Convert a string to camelCase.
 *
 * @param input - The input string.
 * @returns The camelCase version of the string.
 *
 * @example
 * ```ts
 * toCamelCase("hello-world"); // => "helloWorld"
 * toCamelCase("foo_bar_baz"); // => "fooBarBaz"
 * ```
 */
export function toCamelCase(input: string): string {
  return splitWords(input)
    .map((word, index) =>
      index === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    )
    .join("");
}

/**
 * Convert a string to PascalCase.
 *
 * @param input - The input string.
 * @returns The PascalCase version of the string.
 *
 * @example
 * ```ts
 * toPascalCase("hello-world"); // => "HelloWorld"
 * ```
 */
export function toPascalCase(input: string): string {
  return splitWords(input)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

/**
 * Convert a string to snake_case.
 *
 * @param input - The input string.
 * @returns The snake_case version of the string.
 *
 * @example
 * ```ts
 * toSnakeCase("helloWorld"); // => "hello_world"
 * ```
 */
export function toSnakeCase(input: string): string {
  return splitWords(input)
    .map((word) => word.toLowerCase())
    .join("_");
}

/**
 * Convert a string to kebab-case.
 *
 * @param input - The input string.
 * @returns The kebab-case version of the string.
 *
 * @example
 * ```ts
 * toKebabCase("helloWorld"); // => "hello-world"
 * ```
 */
export function toKebabCase(input: string): string {
  return splitWords(input)
    .map((word) => word.toLowerCase())
    .join("-");
}

/**
 * Convert a string to CONSTANT_CASE (SCREAMING_SNAKE_CASE).
 *
 * @param input - The input string.
 * @returns The CONSTANT_CASE version of the string.
 *
 * @example
 * ```ts
 * toConstantCase("helloWorld"); // => "HELLO_WORLD"
 * ```
 */
export function toConstantCase(input: string): string {
  return splitWords(input)
    .map((word) => word.toUpperCase())
    .join("_");
}

/**
 * Convert a string to Title Case.
 *
 * @param input - The input string.
 * @returns The Title Case version of the string.
 *
 * @example
 * ```ts
 * toTitleCase("hello-world"); // => "Hello World"
 * ```
 */
export function toTitleCase(input: string): string {
  return splitWords(input)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Split a string into words by detecting boundaries at non-alphanumeric
 * characters and transitions between lowercase and uppercase letters.
 *
 * @param input - The input string.
 * @returns An array of words.
 */
function splitWords(input: string): string[] {
  // Insert a separator before uppercase letters that follow lowercase letters
  const separated = input.replace(/([a-z])([A-Z])/g, "$1\0$2");
  // Split on non-alphanumeric characters or the inserted separator
  return separated.split(/[\0\s_\-./\\]+/).filter((w) => w.length > 0);
}
