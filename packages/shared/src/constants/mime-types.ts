/**
 * Common MIME type constants used across the platform.
 * @module constants/mime-types
 */

/**
 * MIME types for common content formats.
 */
export const MIME_TYPES = {
  /** JSON content. */
  JSON: "application/json",
  /** Form-encoded content. */
  FORM_URLENCODED: "application/x-www-form-urlencoded",
  /** Multipart form data (file uploads). */
  MULTIPART_FORM_DATA: "multipart/form-data",
  /** Plain text. */
  TEXT_PLAIN: "text/plain",
  /** HTML content. */
  TEXT_HTML: "text/html",
  /** CSS content. */
  TEXT_CSS: "text/css",
  /** CSV data. */
  TEXT_CSV: "text/csv",
  /** XML content. */
  APPLICATION_XML: "application/xml",
  /** PDF documents. */
  APPLICATION_PDF: "application/pdf",
  /** ZIP archives. */
  APPLICATION_ZIP: "application/zip",
  /** GZIP archives. */
  APPLICATION_GZIP: "application/gzip",
  /** TAR archives. */
  APPLICATION_TAR: "application/x-tar",
  /** Binary data / octet stream. */
  OCTET_STREAM: "application/octet-stream",
  /** YAML content. */
  APPLICATION_YAML: "application/x-yaml",
  /** JavaScript. */
  APPLICATION_JS: "application/javascript",
  /** JPEG images. */
  IMAGE_JPEG: "image/jpeg",
  /** PNG images. */
  IMAGE_PNG: "image/png",
  /** GIF images. */
  IMAGE_GIF: "image/gif",
  /** SVG images. */
  IMAGE_SVG: "image/svg+xml",
  /** WebP images. */
  IMAGE_WEBP: "image/webp",
  /** ICO images. */
  IMAGE_ICO: "image/x-icon",
} as const;

/**
 * Type representing any known MIME type string.
 */
export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

/**
 * MIME types that are considered text-based and safe to display inline.
 */
export const TEXT_MIME_TYPES: readonly MimeType[] = [
  MIME_TYPES.JSON,
  MIME_TYPES.TEXT_PLAIN,
  MIME_TYPES.TEXT_HTML,
  MIME_TYPES.TEXT_CSS,
  MIME_TYPES.TEXT_CSV,
  MIME_TYPES.APPLICATION_XML,
  MIME_TYPES.APPLICATION_YAML,
  MIME_TYPES.APPLICATION_JS,
] as const;

/**
 * MIME types that are images.
 */
export const IMAGE_MIME_TYPES: readonly MimeType[] = [
  MIME_TYPES.IMAGE_JPEG,
  MIME_TYPES.IMAGE_PNG,
  MIME_TYPES.IMAGE_GIF,
  MIME_TYPES.IMAGE_SVG,
  MIME_TYPES.IMAGE_WEBP,
  MIME_TYPES.IMAGE_ICO,
] as const;

/**
 * Maps file extensions to their MIME types.
 */
export const EXTENSION_TO_MIME: Record<string, MimeType> = {
  ".json": MIME_TYPES.JSON,
  ".txt": MIME_TYPES.TEXT_PLAIN,
  ".html": MIME_TYPES.TEXT_HTML,
  ".css": MIME_TYPES.TEXT_CSS,
  ".csv": MIME_TYPES.TEXT_CSV,
  ".xml": MIME_TYPES.APPLICATION_XML,
  ".pdf": MIME_TYPES.APPLICATION_PDF,
  ".zip": MIME_TYPES.APPLICATION_ZIP,
  ".gz": MIME_TYPES.APPLICATION_GZIP,
  ".tar": MIME_TYPES.APPLICATION_TAR,
  ".yml": MIME_TYPES.APPLICATION_YAML,
  ".yaml": MIME_TYPES.APPLICATION_YAML,
  ".js": MIME_TYPES.APPLICATION_JS,
  ".jpg": MIME_TYPES.IMAGE_JPEG,
  ".jpeg": MIME_TYPES.IMAGE_JPEG,
  ".png": MIME_TYPES.IMAGE_PNG,
  ".gif": MIME_TYPES.IMAGE_GIF,
  ".svg": MIME_TYPES.IMAGE_SVG,
  ".webp": MIME_TYPES.IMAGE_WEBP,
  ".ico": MIME_TYPES.IMAGE_ICO,
};
