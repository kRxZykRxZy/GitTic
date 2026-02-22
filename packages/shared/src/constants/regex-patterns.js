"use strict";
/**
 * Regular expression patterns for validation across the platform.
 * @module constants/regex-patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PATTERNS = exports.STRONG_PASSWORD_PATTERN = exports.DOCKER_IMAGE_PATTERN = exports.CRON_PATTERN = exports.ENV_VAR_NAME_PATTERN = exports.IPV4_PATTERN = exports.SHA256_PATTERN = exports.SHA1_PATTERN = exports.UUID_V4_PATTERN = exports.GIT_BRANCH_PATTERN = exports.SEMVER_PATTERN = exports.PROJECT_NAME_PATTERN = exports.SLUG_PATTERN = exports.EMAIL_PATTERN = exports.USERNAME_PATTERN = void 0;
/**
 * Pattern for valid usernames (3-39 chars, alphanumeric and hyphens, no leading/trailing hyphen).
 */
exports.USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,37}[a-zA-Z0-9])?$/;
/**
 * Pattern for valid email addresses (RFC 5322 simplified).
 */
exports.EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
/**
 * Pattern for valid URL slugs (lowercase alphanumeric and hyphens).
 */
exports.SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/**
 * Pattern for valid project names (1-100 chars, letters, numbers, hyphens, underscores, spaces).
 */
exports.PROJECT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,98}[a-zA-Z0-9]$/;
/**
 * Pattern for valid semantic version strings (e.g., "1.2.3", "1.0.0-beta.1").
 */
exports.SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
/**
 * Pattern for valid Git branch names.
 */
exports.GIT_BRANCH_PATTERN = /^(?!.*(?:\.\.|@\{|\\))[^\x00-\x1f\x7f ~^:?*[\]]+(?<!\.)(?<!\.lock)$/;
/**
 * Pattern for valid UUID v4 strings.
 */
exports.UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
/**
 * Pattern for valid hexadecimal SHA-1 hashes (40 characters).
 */
exports.SHA1_PATTERN = /^[0-9a-f]{40}$/i;
/**
 * Pattern for valid hexadecimal SHA-256 hashes (64 characters).
 */
exports.SHA256_PATTERN = /^[0-9a-f]{64}$/i;
/**
 * Pattern for valid IPv4 addresses.
 */
exports.IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;
/**
 * Pattern for valid environment variable names (uppercase letters, digits, underscores).
 */
exports.ENV_VAR_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;
/**
 * Pattern for valid cron expressions (5-field).
 */
exports.CRON_PATTERN = /^(\*|([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])) (\*|[0-6])$/;
/**
 * Pattern for valid Docker image references.
 */
exports.DOCKER_IMAGE_PATTERN = /^(?:(?:[a-z0-9]+(?:[._-][a-z0-9]+)*\/)*[a-z0-9]+(?:[._-][a-z0-9]+)*)(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/;
/**
 * Pattern for strong passwords (at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special).
 */
exports.STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
/**
 * Collection of all patterns for programmatic access.
 */
exports.PATTERNS = {
    USERNAME: exports.USERNAME_PATTERN,
    EMAIL: exports.EMAIL_PATTERN,
    SLUG: exports.SLUG_PATTERN,
    PROJECT_NAME: exports.PROJECT_NAME_PATTERN,
    SEMVER: exports.SEMVER_PATTERN,
    GIT_BRANCH: exports.GIT_BRANCH_PATTERN,
    UUID_V4: exports.UUID_V4_PATTERN,
    SHA1: exports.SHA1_PATTERN,
    SHA256: exports.SHA256_PATTERN,
    IPV4: exports.IPV4_PATTERN,
    ENV_VAR_NAME: exports.ENV_VAR_NAME_PATTERN,
    CRON: exports.CRON_PATTERN,
    DOCKER_IMAGE: exports.DOCKER_IMAGE_PATTERN,
    STRONG_PASSWORD: exports.STRONG_PASSWORD_PATTERN,
};
//# sourceMappingURL=regex-patterns.js.map