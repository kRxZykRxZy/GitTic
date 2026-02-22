/**
 * Common MIME type constants used across the platform.
 * @module constants/mime-types
 */
/**
 * MIME types for common content formats.
 */
export declare const MIME_TYPES: {
    /** JSON content. */
    readonly JSON: "application/json";
    /** Form-encoded content. */
    readonly FORM_URLENCODED: "application/x-www-form-urlencoded";
    /** Multipart form data (file uploads). */
    readonly MULTIPART_FORM_DATA: "multipart/form-data";
    /** Plain text. */
    readonly TEXT_PLAIN: "text/plain";
    /** HTML content. */
    readonly TEXT_HTML: "text/html";
    /** CSS content. */
    readonly TEXT_CSS: "text/css";
    /** CSV data. */
    readonly TEXT_CSV: "text/csv";
    /** XML content. */
    readonly APPLICATION_XML: "application/xml";
    /** PDF documents. */
    readonly APPLICATION_PDF: "application/pdf";
    /** ZIP archives. */
    readonly APPLICATION_ZIP: "application/zip";
    /** GZIP archives. */
    readonly APPLICATION_GZIP: "application/gzip";
    /** TAR archives. */
    readonly APPLICATION_TAR: "application/x-tar";
    /** Binary data / octet stream. */
    readonly OCTET_STREAM: "application/octet-stream";
    /** YAML content. */
    readonly APPLICATION_YAML: "application/x-yaml";
    /** JavaScript. */
    readonly APPLICATION_JS: "application/javascript";
    /** JPEG images. */
    readonly IMAGE_JPEG: "image/jpeg";
    /** PNG images. */
    readonly IMAGE_PNG: "image/png";
    /** GIF images. */
    readonly IMAGE_GIF: "image/gif";
    /** SVG images. */
    readonly IMAGE_SVG: "image/svg+xml";
    /** WebP images. */
    readonly IMAGE_WEBP: "image/webp";
    /** ICO images. */
    readonly IMAGE_ICO: "image/x-icon";
};
/**
 * Type representing any known MIME type string.
 */
export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];
/**
 * MIME types that are considered text-based and safe to display inline.
 */
export declare const TEXT_MIME_TYPES: readonly MimeType[];
/**
 * MIME types that are images.
 */
export declare const IMAGE_MIME_TYPES: readonly MimeType[];
/**
 * Maps file extensions to their MIME types.
 */
export declare const EXTENSION_TO_MIME: Record<string, MimeType>;
//# sourceMappingURL=mime-types.d.ts.map