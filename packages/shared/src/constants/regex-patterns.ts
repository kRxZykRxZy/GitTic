/**
 * Regular expression patterns for validation across the platform.
 * @module constants/regex-patterns
 */

/**
 * Pattern for valid usernames (3-39 chars, alphanumeric and hyphens, no leading/trailing hyphen).
 */
export const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{1,37}[a-zA-Z0-9])?$/;

/**
 * Pattern for valid email addresses (RFC 5322 simplified).
 */
export const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

/**
 * Pattern for valid URL slugs (lowercase alphanumeric and hyphens).
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Pattern for valid project names (1-100 chars, letters, numbers, hyphens, underscores, spaces).
 */
export const PROJECT_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9 _-]{0,98}[a-zA-Z0-9]$/;

/**
 * Pattern for valid semantic version strings (e.g., "1.2.3", "1.0.0-beta.1").
 */
export const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Pattern for valid Git branch names.
 */
export const GIT_BRANCH_PATTERN = /^(?!.*(?:\.\.|@\{|\\))[^\x00-\x1f\x7f ~^:?*[\]]+(?<!\.)(?<!\.lock)$/;

/**
 * Pattern for valid UUID v4 strings.
 */
export const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Pattern for valid hexadecimal SHA-1 hashes (40 characters).
 */
export const SHA1_PATTERN = /^[0-9a-f]{40}$/i;

/**
 * Pattern for valid hexadecimal SHA-256 hashes (64 characters).
 */
export const SHA256_PATTERN = /^[0-9a-f]{64}$/i;

/**
 * Pattern for valid IPv4 addresses.
 */
export const IPV4_PATTERN = /^(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)$/;

/**
 * Pattern for valid environment variable names (uppercase letters, digits, underscores).
 */
export const ENV_VAR_NAME_PATTERN = /^[A-Z][A-Z0-9_]*$/;

/**
 * Pattern for valid cron expressions (5-field).
 */
export const CRON_PATTERN = /^(\*|([0-9]|[1-5][0-9])) (\*|([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|[12][0-9]|3[01])) (\*|([1-9]|1[0-2])) (\*|[0-6])$/;

/**
 * Pattern for valid Docker image references.
 */
export const DOCKER_IMAGE_PATTERN = /^(?:(?:[a-z0-9]+(?:[._-][a-z0-9]+)*\/)*[a-z0-9]+(?:[._-][a-z0-9]+)*)(?::[\w][\w.-]{0,127})?(?:@sha256:[a-f0-9]{64})?$/;

/**
 * Pattern for strong passwords (at least 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special).
 */
export const STRONG_PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;

/**
 * Collection of all patterns for programmatic access.
 */
export const PATTERNS = {
  USERNAME: USERNAME_PATTERN,
  EMAIL: EMAIL_PATTERN,
  SLUG: SLUG_PATTERN,
  PROJECT_NAME: PROJECT_NAME_PATTERN,
  SEMVER: SEMVER_PATTERN,
  GIT_BRANCH: GIT_BRANCH_PATTERN,
  UUID_V4: UUID_V4_PATTERN,
  SHA1: SHA1_PATTERN,
  SHA256: SHA256_PATTERN,
  IPV4: IPV4_PATTERN,
  ENV_VAR_NAME: ENV_VAR_NAME_PATTERN,
  CRON: CRON_PATTERN,
  DOCKER_IMAGE: DOCKER_IMAGE_PATTERN,
  STRONG_PASSWORD: STRONG_PASSWORD_PATTERN,
} as const;
