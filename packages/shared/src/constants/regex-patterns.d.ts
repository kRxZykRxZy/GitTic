/**
 * Regular expression patterns for validation across the platform.
 * @module constants/regex-patterns
 */
/**
 * Pattern for valid usernames (3-39 chars, alphanumeric and hyphens, no leading/trailing hyphen).
 */
export declare const USERNAME_PATTERN: RegExp;
/**
 * Pattern for valid email addresses (RFC 5322 simplified).
 */
export declare const EMAIL_PATTERN: RegExp;
/**
 * Pattern for valid URL slugs (lowercase alphanumeric and hyphens).
 */
export declare const SLUG_PATTERN: RegExp;
/**
 * Pattern for valid project names (1-100 chars, letters, numbers, hyphens, underscores, spaces).
 */
export declare const PROJECT_NAME_PATTERN: RegExp;
/**
 * Pattern for valid semantic version strings (e.g., "1.2.3", "1.0.0-beta.1").
 */
export declare const SEMVER_PATTERN: RegExp;
/**
 * Pattern for valid Git branch names.
 */
export declare const GIT_BRANCH_PATTERN: RegExp;
/**
 * Pattern for valid UUID v4 strings.
 */
export declare const UUID_V4_PATTERN: RegExp;
/**
 * Pattern for valid hexadecimal SHA-1 hashes (40 characters).
 */
export declare const SHA1_PATTERN: RegExp;
/**
 * Pattern for valid hexadecimal SHA-256 hashes (64 characters).
 */
export declare const SHA256_PATTERN: RegExp;
/**
 * Pattern for valid IPv4 addresses.
 */
export declare const IPV4_PATTERN: RegExp;
/**
 * Pattern for valid environment variable names (uppercase letters, digits, underscores).
 */
export declare const ENV_VAR_NAME_PATTERN: RegExp;
/**
 * Pattern for valid cron expressions (5-field).
 */
export declare const CRON_PATTERN: RegExp;
/**
 * Pattern for valid Docker image references.
 */
export declare const DOCKER_IMAGE_PATTERN: RegExp;
/**
 * Pattern for strong passwords (at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special).
 */
export declare const STRONG_PASSWORD_PATTERN: RegExp;
/**
 * Collection of all patterns for programmatic access.
 */
export declare const PATTERNS: {
    readonly USERNAME: RegExp;
    readonly EMAIL: RegExp;
    readonly SLUG: RegExp;
    readonly PROJECT_NAME: RegExp;
    readonly SEMVER: RegExp;
    readonly GIT_BRANCH: RegExp;
    readonly UUID_V4: RegExp;
    readonly SHA1: RegExp;
    readonly SHA256: RegExp;
    readonly IPV4: RegExp;
    readonly ENV_VAR_NAME: RegExp;
    readonly CRON: RegExp;
    readonly DOCKER_IMAGE: RegExp;
    readonly STRONG_PASSWORD: RegExp;
};
//# sourceMappingURL=regex-patterns.d.ts.map