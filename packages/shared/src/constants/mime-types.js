"use strict";
/**
 * Common MIME type constants used across the platform.
 * @module constants/mime-types
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EXTENSION_TO_MIME = exports.IMAGE_MIME_TYPES = exports.TEXT_MIME_TYPES = exports.MIME_TYPES = void 0;
/**
 * MIME types for common content formats.
 */
exports.MIME_TYPES = {
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
};
/**
 * MIME types that are considered text-based and safe to display inline.
 */
exports.TEXT_MIME_TYPES = [
    exports.MIME_TYPES.JSON,
    exports.MIME_TYPES.TEXT_PLAIN,
    exports.MIME_TYPES.TEXT_HTML,
    exports.MIME_TYPES.TEXT_CSS,
    exports.MIME_TYPES.TEXT_CSV,
    exports.MIME_TYPES.APPLICATION_XML,
    exports.MIME_TYPES.APPLICATION_YAML,
    exports.MIME_TYPES.APPLICATION_JS,
];
/**
 * MIME types that are images.
 */
exports.IMAGE_MIME_TYPES = [
    exports.MIME_TYPES.IMAGE_JPEG,
    exports.MIME_TYPES.IMAGE_PNG,
    exports.MIME_TYPES.IMAGE_GIF,
    exports.MIME_TYPES.IMAGE_SVG,
    exports.MIME_TYPES.IMAGE_WEBP,
    exports.MIME_TYPES.IMAGE_ICO,
];
/**
 * Maps file extensions to their MIME types.
 */
exports.EXTENSION_TO_MIME = {
    ".json": exports.MIME_TYPES.JSON,
    ".txt": exports.MIME_TYPES.TEXT_PLAIN,
    ".html": exports.MIME_TYPES.TEXT_HTML,
    ".css": exports.MIME_TYPES.TEXT_CSS,
    ".csv": exports.MIME_TYPES.TEXT_CSV,
    ".xml": exports.MIME_TYPES.APPLICATION_XML,
    ".pdf": exports.MIME_TYPES.APPLICATION_PDF,
    ".zip": exports.MIME_TYPES.APPLICATION_ZIP,
    ".gz": exports.MIME_TYPES.APPLICATION_GZIP,
    ".tar": exports.MIME_TYPES.APPLICATION_TAR,
    ".yml": exports.MIME_TYPES.APPLICATION_YAML,
    ".yaml": exports.MIME_TYPES.APPLICATION_YAML,
    ".js": exports.MIME_TYPES.APPLICATION_JS,
    ".jpg": exports.MIME_TYPES.IMAGE_JPEG,
    ".jpeg": exports.MIME_TYPES.IMAGE_JPEG,
    ".png": exports.MIME_TYPES.IMAGE_PNG,
    ".gif": exports.MIME_TYPES.IMAGE_GIF,
    ".svg": exports.MIME_TYPES.IMAGE_SVG,
    ".webp": exports.MIME_TYPES.IMAGE_WEBP,
    ".ico": exports.MIME_TYPES.IMAGE_ICO,
};
//# sourceMappingURL=mime-types.js.map