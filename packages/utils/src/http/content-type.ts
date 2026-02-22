/**
 * A map of common MIME types by file extension.
 */
const MIME_TYPES: Readonly<Record<string, string>> = {
  html: "text/html",
  htm: "text/html",
  css: "text/css",
  js: "application/javascript",
  mjs: "application/javascript",
  json: "application/json",
  xml: "application/xml",
  txt: "text/plain",
  csv: "text/csv",
  md: "text/markdown",
  pdf: "application/pdf",
  zip: "application/zip",
  gz: "application/gzip",
  tar: "application/x-tar",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  svg: "image/svg+xml",
  webp: "image/webp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  mp4: "video/mp4",
  webm: "video/webm",
  woff: "font/woff",
  woff2: "font/woff2",
  ttf: "font/ttf",
  otf: "font/otf",
  wasm: "application/wasm",
  yaml: "application/x-yaml",
  yml: "application/x-yaml",
  ts: "application/typescript",
  tsx: "application/typescript",
};

/**
 * Get the MIME type for a given file extension.
 *
 * @param extension - The file extension (with or without leading dot).
 * @returns The MIME type string, or "application/octet-stream" if unknown.
 *
 * @example
 * ```ts
 * getMimeType("json");  // => "application/json"
 * getMimeType(".html"); // => "text/html"
 * ```
 */
export function getMimeType(extension: string): string {
  const ext = extension.replace(/^\./, "").toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

/**
 * Get the file extension for a given MIME type.
 *
 * @param mimeType - The MIME type string.
 * @returns The file extension (without dot), or undefined if not found.
 */
export function getExtension(mimeType: string): string | undefined {
  const lower = mimeType.toLowerCase().split(";")[0]!.trim();
  for (const [ext, mime] of Object.entries(MIME_TYPES)) {
    if (mime === lower) {
      return ext;
    }
  }
  return undefined;
}

/**
 * Parse a Content-Type header into its MIME type and parameters.
 *
 * @param header - The Content-Type header value.
 * @returns An object with `type` and `params`.
 *
 * @example
 * ```ts
 * parseContentType("text/html; charset=utf-8");
 * // => { type: "text/html", params: { charset: "utf-8" } }
 * ```
 */
export function parseContentType(
  header: string,
): { type: string; params: Record<string, string> } {
  const parts = header.split(";").map((s) => s.trim());
  const type = parts[0]!.toLowerCase();
  const params: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const eqIndex = parts[i]!.indexOf("=");
    if (eqIndex !== -1) {
      const key = parts[i]!.slice(0, eqIndex).trim().toLowerCase();
      const value = parts[i]!.slice(eqIndex + 1).trim().replace(/^"|"$/g, "");
      params[key] = value;
    }
  }

  return { type, params };
}

/**
 * Check if a MIME type represents text content.
 *
 * @param mimeType - The MIME type to check.
 * @returns `true` if the MIME type is textual.
 */
export function isTextMimeType(mimeType: string): boolean {
  const lower = mimeType.toLowerCase();
  return (
    lower.startsWith("text/") ||
    lower === "application/json" ||
    lower === "application/xml" ||
    lower === "application/javascript" ||
    lower.endsWith("+xml") ||
    lower.endsWith("+json")
  );
}

/**
 * Build a Content-Type header value from a MIME type and optional charset.
 *
 * @param mimeType - The MIME type.
 * @param charset - The character encoding. Defaults to "utf-8" for text types.
 * @returns The Content-Type header value.
 */
export function buildContentType(
  mimeType: string,
  charset?: string,
): string {
  if (charset) {
    return `${mimeType}; charset=${charset}`;
  }
  if (isTextMimeType(mimeType)) {
    return `${mimeType}; charset=utf-8`;
  }
  return mimeType;
}
