/**
 * Platform limits and quota constants.
 * @module constants/limits
 */
/**
 * Maximum lengths for string fields.
 */
export declare const STRING_LIMITS: {
    /** Maximum length of a username. */
    readonly USERNAME_MAX: 39;
    /** Minimum length of a username. */
    readonly USERNAME_MIN: 3;
    /** Maximum length of a display name. */
    readonly DISPLAY_NAME_MAX: 100;
    /** Maximum length of an email address. */
    readonly EMAIL_MAX: 254;
    /** Maximum length of a project name. */
    readonly PROJECT_NAME_MAX: 100;
    /** Maximum length of a project description. */
    readonly PROJECT_DESCRIPTION_MAX: 1000;
    /** Maximum length of an organization name. */
    readonly ORG_NAME_MAX: 100;
    /** Maximum length of a team name. */
    readonly TEAM_NAME_MAX: 100;
    /** Maximum length of a URL slug. */
    readonly SLUG_MAX: 100;
    /** Maximum length of a commit message. */
    readonly COMMIT_MESSAGE_MAX: 72;
    /** Maximum length of a bio field. */
    readonly BIO_MAX: 500;
    /** Maximum length of a webhook URL. */
    readonly WEBHOOK_URL_MAX: 2048;
    /** Maximum length of an API key name. */
    readonly API_KEY_NAME_MAX: 100;
};
/**
 * Password policy limits.
 */
export declare const PASSWORD_LIMITS: {
    /** Minimum password length. */
    readonly MIN_LENGTH: 8;
    /** Maximum password length. */
    readonly MAX_LENGTH: 128;
    /** Number of previous passwords that cannot be reused. */
    readonly HISTORY_COUNT: 5;
};
/**
 * Pagination limits.
 */
export declare const PAGINATION_LIMITS: {
    /** Default page size when not specified. */
    readonly DEFAULT_PAGE_SIZE: 20;
    /** Maximum page size allowed. */
    readonly MAX_PAGE_SIZE: 100;
    /** Minimum page size allowed. */
    readonly MIN_PAGE_SIZE: 1;
    /** Maximum offset for offset-based pagination. */
    readonly MAX_OFFSET: 10000;
};
/**
 * File upload limits.
 */
export declare const UPLOAD_LIMITS: {
    /** Maximum file upload size in bytes (50 MB). */
    readonly MAX_FILE_SIZE_BYTES: number;
    /** Maximum avatar image size in bytes (2 MB). */
    readonly MAX_AVATAR_SIZE_BYTES: number;
    /** Maximum number of files per upload request. */
    readonly MAX_FILES_PER_REQUEST: 10;
    /** Maximum total request body size in bytes (100 MB). */
    readonly MAX_REQUEST_BODY_BYTES: number;
};
/**
 * Rate limiting defaults.
 */
export declare const RATE_LIMITS: {
    /** Default requests per minute for authenticated users. */
    readonly AUTHENTICATED_RPM: 300;
    /** Default requests per minute for unauthenticated users. */
    readonly UNAUTHENTICATED_RPM: 60;
    /** Requests per minute for API keys. */
    readonly API_KEY_RPM: 600;
    /** Requests per minute for search endpoints. */
    readonly SEARCH_RPM: 30;
    /** Maximum burst size. */
    readonly MAX_BURST: 50;
};
/**
 * Resource count limits.
 */
export declare const RESOURCE_LIMITS: {
    /** Maximum webhooks per project. */
    readonly MAX_WEBHOOKS_PER_PROJECT: 20;
    /** Maximum environments per project. */
    readonly MAX_ENVIRONMENTS_PER_PROJECT: 10;
    /** Maximum variables per scope. */
    readonly MAX_VARIABLES_PER_SCOPE: 100;
    /** Maximum secrets per project. */
    readonly MAX_SECRETS_PER_PROJECT: 50;
    /** Maximum teams per organization. */
    readonly MAX_TEAMS_PER_ORG: 100;
    /** Maximum tags per project. */
    readonly MAX_TAGS_PER_PROJECT: 20;
    /** Maximum pipeline stages. */
    readonly MAX_PIPELINE_STAGES: 20;
    /** Maximum concurrent pipeline runs per project. */
    readonly MAX_CONCURRENT_PIPELINES: 5;
};
//# sourceMappingURL=limits.d.ts.map