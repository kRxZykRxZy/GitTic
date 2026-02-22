"use strict";
/**
 * Default values used across the platform.
 * @module constants/defaults
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_APPEARANCE = exports.DEFAULT_NOTIFICATION_SETTINGS = exports.DEFAULT_PROJECT_SETTINGS = exports.DEFAULT_RETRY = exports.DEFAULT_TIMEOUTS = exports.DEFAULT_PAGINATION = void 0;
/**
 * Default pagination settings.
 */
exports.DEFAULT_PAGINATION = {
    /** Default page number. */
    PAGE: 1,
    /** Default number of items per page. */
    PER_PAGE: 20,
    /** Default sort direction. */
    SORT_DIRECTION: "desc",
    /** Default sort field. */
    SORT_FIELD: "createdAt",
};
/**
 * Default timeout values in milliseconds.
 */
exports.DEFAULT_TIMEOUTS = {
    /** Default API request timeout. */
    API_REQUEST_MS: 30_000,
    /** Default WebSocket ping interval. */
    WS_PING_INTERVAL_MS: 30_000,
    /** Default WebSocket reconnect delay. */
    WS_RECONNECT_DELAY_MS: 5_000,
    /** Default health check interval. */
    HEALTH_CHECK_INTERVAL_MS: 60_000,
    /** Default cluster heartbeat interval. */
    HEARTBEAT_INTERVAL_MS: 15_000,
    /** Default session inactivity timeout. */
    SESSION_TIMEOUT_MS: 3_600_000,
    /** Default pipeline stage timeout. */
    PIPELINE_STAGE_TIMEOUT_MS: 1_800_000,
    /** Default deployment timeout. */
    DEPLOYMENT_TIMEOUT_MS: 600_000,
};
/**
 * Default retry settings.
 */
exports.DEFAULT_RETRY = {
    /** Maximum number of retry attempts. */
    MAX_ATTEMPTS: 3,
    /** Initial delay between retries in milliseconds. */
    INITIAL_DELAY_MS: 1_000,
    /** Backoff multiplier applied on each retry. */
    BACKOFF_MULTIPLIER: 2,
    /** Maximum delay between retries in milliseconds. */
    MAX_DELAY_MS: 30_000,
};
/**
 * Default project settings.
 */
exports.DEFAULT_PROJECT_SETTINGS = {
    /** Default branch name. */
    DEFAULT_BRANCH: "main",
    /** Default visibility for new projects. */
    VISIBILITY: "private",
    /** Whether issues are enabled by default. */
    ISSUES_ENABLED: true,
    /** Whether wiki is enabled by default. */
    WIKI_ENABLED: false,
    /** Whether discussions are enabled by default. */
    DISCUSSIONS_ENABLED: false,
    /** Default merge strategy. */
    MERGE_STRATEGY: "squash",
    /** Default minimum approvals required. */
    MIN_APPROVALS: 1,
    /** Whether to auto-delete branches after merge by default. */
    AUTO_DELETE_BRANCHES: true,
};
/**
 * Default notification settings.
 */
exports.DEFAULT_NOTIFICATION_SETTINGS = {
    /** Whether email notifications are enabled by default. */
    EMAIL_ENABLED: true,
    /** Whether push notifications are enabled by default. */
    PUSH_ENABLED: false,
    /** Whether in-app notifications are enabled by default. */
    IN_APP_ENABLED: true,
    /** Default digest frequency. */
    DIGEST_FREQUENCY: "daily",
};
/**
 * Default UI appearance settings.
 */
exports.DEFAULT_APPEARANCE = {
    /** Default theme. */
    THEME: "system",
    /** Default compact mode. */
    COMPACT_MODE: false,
    /** Default density. */
    DENSITY: "comfortable",
    /** Default font size. */
    FONT_SIZE: "medium",
    /** Default editor theme. */
    EDITOR_THEME: "vs-dark",
    /** Default line numbers visibility. */
    SHOW_LINE_NUMBERS: true,
    /** Default tab size. */
    TAB_SIZE: 2,
};
//# sourceMappingURL=defaults.js.map