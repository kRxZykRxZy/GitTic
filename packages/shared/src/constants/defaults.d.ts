/**
 * Default values used across the platform.
 * @module constants/defaults
 */
/**
 * Default pagination settings.
 */
export declare const DEFAULT_PAGINATION: {
    /** Default page number. */
    readonly PAGE: 1;
    /** Default number of items per page. */
    readonly PER_PAGE: 20;
    /** Default sort direction. */
    readonly SORT_DIRECTION: "desc";
    /** Default sort field. */
    readonly SORT_FIELD: "createdAt";
};
/**
 * Default timeout values in milliseconds.
 */
export declare const DEFAULT_TIMEOUTS: {
    /** Default API request timeout. */
    readonly API_REQUEST_MS: 30000;
    /** Default WebSocket ping interval. */
    readonly WS_PING_INTERVAL_MS: 30000;
    /** Default WebSocket reconnect delay. */
    readonly WS_RECONNECT_DELAY_MS: 5000;
    /** Default health check interval. */
    readonly HEALTH_CHECK_INTERVAL_MS: 60000;
    /** Default cluster heartbeat interval. */
    readonly HEARTBEAT_INTERVAL_MS: 15000;
    /** Default session inactivity timeout. */
    readonly SESSION_TIMEOUT_MS: 3600000;
    /** Default pipeline stage timeout. */
    readonly PIPELINE_STAGE_TIMEOUT_MS: 1800000;
    /** Default deployment timeout. */
    readonly DEPLOYMENT_TIMEOUT_MS: 600000;
};
/**
 * Default retry settings.
 */
export declare const DEFAULT_RETRY: {
    /** Maximum number of retry attempts. */
    readonly MAX_ATTEMPTS: 3;
    /** Initial delay between retries in milliseconds. */
    readonly INITIAL_DELAY_MS: 1000;
    /** Backoff multiplier applied on each retry. */
    readonly BACKOFF_MULTIPLIER: 2;
    /** Maximum delay between retries in milliseconds. */
    readonly MAX_DELAY_MS: 30000;
};
/**
 * Default project settings.
 */
export declare const DEFAULT_PROJECT_SETTINGS: {
    /** Default branch name. */
    readonly DEFAULT_BRANCH: "main";
    /** Default visibility for new projects. */
    readonly VISIBILITY: "private";
    /** Whether issues are enabled by default. */
    readonly ISSUES_ENABLED: true;
    /** Whether wiki is enabled by default. */
    readonly WIKI_ENABLED: false;
    /** Whether discussions are enabled by default. */
    readonly DISCUSSIONS_ENABLED: false;
    /** Default merge strategy. */
    readonly MERGE_STRATEGY: "squash";
    /** Default minimum approvals required. */
    readonly MIN_APPROVALS: 1;
    /** Whether to auto-delete branches after merge by default. */
    readonly AUTO_DELETE_BRANCHES: true;
};
/**
 * Default notification settings.
 */
export declare const DEFAULT_NOTIFICATION_SETTINGS: {
    /** Whether email notifications are enabled by default. */
    readonly EMAIL_ENABLED: true;
    /** Whether push notifications are enabled by default. */
    readonly PUSH_ENABLED: false;
    /** Whether in-app notifications are enabled by default. */
    readonly IN_APP_ENABLED: true;
    /** Default digest frequency. */
    readonly DIGEST_FREQUENCY: "daily";
};
/**
 * Default UI appearance settings.
 */
export declare const DEFAULT_APPEARANCE: {
    /** Default theme. */
    readonly THEME: "system";
    /** Default compact mode. */
    readonly COMPACT_MODE: false;
    /** Default density. */
    readonly DENSITY: "comfortable";
    /** Default font size. */
    readonly FONT_SIZE: "medium";
    /** Default editor theme. */
    readonly EDITOR_THEME: "vs-dark";
    /** Default line numbers visibility. */
    readonly SHOW_LINE_NUMBERS: true;
    /** Default tab size. */
    readonly TAB_SIZE: 2;
};
//# sourceMappingURL=defaults.d.ts.map