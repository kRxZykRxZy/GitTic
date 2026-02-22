/**
 * A template context is a record of string keys to values of any type.
 */
export type TemplateContext = Record<string, unknown>;

/**
 * Options for the template engine.
 */
export interface TemplateOptions {
  /** Opening delimiter for placeholders. Defaults to "{{". */
  openDelimiter?: string;
  /** Closing delimiter for placeholders. Defaults to "}}". */
  closeDelimiter?: string;
  /** Whether to throw on missing keys. Defaults to false (replaces with ""). */
  throwOnMissing?: boolean;
  /** A fallback value for missing keys (used when throwOnMissing is false). Defaults to "". */
  fallback?: string;
}

/**
 * Render a template string by replacing placeholders with values
 * from the provided context.
 *
 * @param template - The template string containing placeholders.
 * @param context - The key-value pairs to interpolate.
 * @param options - Optional template configuration.
 * @returns The rendered string with placeholders replaced.
 * @throws If `throwOnMissing` is true and a placeholder key is not found.
 *
 * @example
 * ```ts
 * render("Hello, {{name}}!", { name: "World" });
 * // => "Hello, World!"
 *
 * render("Hi, ${user}", { user: "Alice" }, { openDelimiter: "${", closeDelimiter: "}" });
 * // => "Hi, Alice"
 * ```
 */
export function render(
  template: string,
  context: TemplateContext,
  options: TemplateOptions = {},
): string {
  const {
    openDelimiter = "{{",
    closeDelimiter = "}}",
    throwOnMissing = false,
    fallback = "",
  } = options;

  const open = escapeRegExp(openDelimiter);
  const close = escapeRegExp(closeDelimiter);
  const pattern = new RegExp(`${open}\\s*([\\w.]+)\\s*${close}`, "g");

  return template.replace(pattern, (_match, key: string) => {
    const value = resolveKey(context, key);
    if (value === undefined) {
      if (throwOnMissing) {
        throw new Error(`Missing template key: "${key}"`);
      }
      return fallback;
    }
    return String(value);
  });
}

/**
 * Resolve a dotted key path from a context object.
 *
 * @param context - The context object.
 * @param key - A dot-separated key path (e.g., "user.name").
 * @returns The resolved value or undefined.
 */
function resolveKey(context: TemplateContext, key: string): unknown {
  const parts = key.split(".");
  let current: unknown = context;

  for (const part of parts) {
    if (current == null || typeof current !== "object") {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Compile a template string into a reusable render function.
 *
 * @param template - The template string.
 * @param options - Optional template configuration.
 * @returns A function that accepts a context and returns the rendered string.
 *
 * @example
 * ```ts
 * const greet = compile("Hello, {{name}}!");
 * greet({ name: "Alice" }); // => "Hello, Alice!"
 * greet({ name: "Bob" });   // => "Hello, Bob!"
 * ```
 */
export function compile(
  template: string,
  options: TemplateOptions = {},
): (context: TemplateContext) => string {
  return (context: TemplateContext) => render(template, context, options);
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
