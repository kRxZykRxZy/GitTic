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
export declare function render(template: string, context: TemplateContext, options?: TemplateOptions): string;
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
export declare function compile(template: string, options?: TemplateOptions): (context: TemplateContext) => string;
//# sourceMappingURL=template.d.ts.map