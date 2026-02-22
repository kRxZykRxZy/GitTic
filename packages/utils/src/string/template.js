"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.render = render;
exports.compile = compile;
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
function render(template, context, options = {}) {
    const { openDelimiter = "{{", closeDelimiter = "}}", throwOnMissing = false, fallback = "", } = options;
    const open = escapeRegExp(openDelimiter);
    const close = escapeRegExp(closeDelimiter);
    const pattern = new RegExp(`${open}\\s*([\\w.]+)\\s*${close}`, "g");
    return template.replace(pattern, (_match, key) => {
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
function resolveKey(context, key) {
    const parts = key.split(".");
    let current = context;
    for (const part of parts) {
        if (current == null || typeof current !== "object") {
            return undefined;
        }
        current = current[part];
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
function compile(template, options = {}) {
    return (context) => render(template, context, options);
}
/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
//# sourceMappingURL=template.js.map