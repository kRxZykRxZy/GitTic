"use strict";
/**
 * Platform limits and quota constants.
 * @module constants/limits
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RESOURCE_LIMITS = exports.RATE_LIMITS = exports.UPLOAD_LIMITS = exports.PAGINATION_LIMITS = exports.PASSWORD_LIMITS = exports.STRING_LIMITS = void 0;
/**
 * Maximum lengths for string fields.
 */
exports.STRING_LIMITS = {
    /** Maximum length of a username. */
    USERNAME_MAX: 39,
    /** Minimum length of a username. */
    USERNAME_MIN: 3,
    /** Maximum length of a display name. */
    DISPLAY_NAME_MAX: 100,
    /** Maximum length of an email address. */
    EMAIL_MAX: 254,
    /** Maximum length of a project name. */
    PROJECT_NAME_MAX: 100,
    /** Maximum length of a project description. */
    PROJECT_DESCRIPTION_MAX: 1000,
    /** Maximum length of an organization name. */
    ORG_NAME_MAX: 100,
    /** Maximum length of a team name. */
    TEAM_NAME_MAX: 100,
    /** Maximum length of a URL slug. */
    SLUG_MAX: 100,
    /** Maximum length of a commit message. */
    COMMIT_MESSAGE_MAX: 72,
    /** Maximum length of a bio field. */
    BIO_MAX: 500,
    /** Maximum length of a webhook URL. */
    WEBHOOK_URL_MAX: 2048,
    /** Maximum length of an API key name. */
    API_KEY_NAME_MAX: 100,
};
/**
 * Password policy limits.
 */
exports.PASSWORD_LIMITS = {
    /** Minimum password length. */
    MIN_LENGTH: 8,
    /** Maximum password length. */
    MAX_LENGTH: 128,
    /** Number of previous passwords that cannot be reused. */
    HISTORY_COUNT: 5,
};
/**
 * Pagination limits.
 */
exports.PAGINATION_LIMITS = {
    /** Default page size when not specified. */
    DEFAULT_PAGE_SIZE: 20,
    /** Maximum page size allowed. */
    MAX_PAGE_SIZE: 100,
    /** Minimum page size allowed. */
    MIN_PAGE_SIZE: 1,
    /** Maximum offset for offset-based pagination. */
    MAX_OFFSET: 10000,
};
/**
 * File upload limits.
 */
exports.UPLOAD_LIMITS = {
    /** Maximum file upload size in bytes (50 MB). */
    MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024,
    /** Maximum avatar image size in bytes (2 MB). */
    MAX_AVATAR_SIZE_BYTES: 2 * 1024 * 1024,
    /** Maximum number of files per upload request. */
    MAX_FILES_PER_REQUEST: 10,
    /** Maximum total request body size in bytes (100 MB). */
    MAX_REQUEST_BODY_BYTES: 100 * 1024 * 1024,
};
/**
 * Rate limiting defaults.
 */
exports.RATE_LIMITS = {
    /** Default requests per minute for authenticated users. */
    AUTHENTICATED_RPM: 300,
    /** Default requests per minute for unauthenticated users. */
    UNAUTHENTICATED_RPM: 60,
    /** Requests per minute for API keys. */
    API_KEY_RPM: 600,
    /** Requests per minute for search endpoints. */
    SEARCH_RPM: 30,
    /** Maximum burst size. */
    MAX_BURST: 50,
};
/**
 * Resource count limits.
 */
exports.RESOURCE_LIMITS = {
    /** Maximum webhooks per project. */
    MAX_WEBHOOKS_PER_PROJECT: 20,
    /** Maximum environments per project. */
    MAX_ENVIRONMENTS_PER_PROJECT: 10,
    /** Maximum variables per scope. */
    MAX_VARIABLES_PER_SCOPE: 100,
    /** Maximum secrets per project. */
    MAX_SECRETS_PER_PROJECT: 50,
    /** Maximum teams per organization. */
    MAX_TEAMS_PER_ORG: 100,
    /** Maximum tags per project. */
    MAX_TAGS_PER_PROJECT: 20,
    /** Maximum pipeline stages. */
    MAX_PIPELINE_STAGES: 20,
    /** Maximum concurrent pipeline runs per project. */
    MAX_CONCURRENT_PIPELINES: 5,
};
//# sourceMappingURL=limits.js.map