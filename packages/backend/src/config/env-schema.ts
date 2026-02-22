/**
 * Full environment variable schema with defaults and validation.
 * Every configurable setting is represented as an env var entry.
 */

/** Descriptor for a single environment variable. */
export interface EnvVarDef {
    /** Environment variable name */
    name: string;
    /** Human-readable description */
    description: string;
    /** Default value (undefined means required) */
    defaultValue?: string;
    /** Whether this variable is required */
    required: boolean;
    /** Expected type hint for documentation */
    type: "string" | "number" | "boolean";
}

/** Complete schema of all supported environment variables. */
export const ENV_SCHEMA: EnvVarDef[] = [
    // ── Core ──────────────────────────────────────────
    { name: "NODE_ENV", description: "Runtime environment", defaultValue: "development", required: false, type: "string" },
    { name: "PORT", description: "HTTP server port", defaultValue: "3000", required: false, type: "number" },
    { name: "HOST", description: "HTTP server bind address", defaultValue: "0.0.0.0", required: false, type: "string" },
    { name: "LOG_LEVEL", description: "Logging level (debug, info, warn, error)", defaultValue: "info", required: false, type: "string" },
    { name: "DATA_DIR", description: "Root data directory", defaultValue: "./data", required: false, type: "string" },

    // ── Database ──────────────────────────────────────
    { name: "DB_DRIVER", description: "Database driver (sqlite or postgres)", defaultValue: "sqlite", required: false, type: "string" },
    { name: "SQLITE_PATH", description: "Path to SQLite database file", defaultValue: "./data/platform.sqlite", required: false, type: "string" },
    { name: "POSTGRES_HOST", description: "PostgreSQL host", defaultValue: "localhost", required: false, type: "string" },
    { name: "POSTGRES_PORT", description: "PostgreSQL port", defaultValue: "5432", required: false, type: "number" },
    { name: "POSTGRES_USER", description: "PostgreSQL user", defaultValue: "platform", required: false, type: "string" },
    { name: "POSTGRES_PASSWORD", description: "PostgreSQL password", defaultValue: "", required: false, type: "string" },
    { name: "POSTGRES_DB", description: "PostgreSQL database name", defaultValue: "platform", required: false, type: "string" },

    // ── Redis ─────────────────────────────────────────
    { name: "REDIS_ENABLED", description: "Enable Redis for caching/queues", defaultValue: "false", required: false, type: "boolean" },
    { name: "REDIS_URL", description: "Redis connection URL", defaultValue: "", required: false, type: "string" },

    // ── JWT / Auth ────────────────────────────────────
    { name: "JWT_SECRET", description: "Secret key for signing JWTs", defaultValue: "dev-secret-change-me", required: false, type: "string" },
    { name: "JWT_EXPIRES_IN", description: "JWT token lifetime", defaultValue: "7d", required: false, type: "string" },
    { name: "CSRF_SECRET", description: "CSRF token secret", defaultValue: "dev-csrf-secret", required: false, type: "string" },

    // ── Storage / Limits ──────────────────────────────
    { name: "GIT_STORAGE_PATH", description: "Path for bare git repositories", defaultValue: "./data/repos", required: false, type: "string" },
    { name: "MAX_REPOS_PER_USER", description: "Maximum repos allowed per user", defaultValue: "50", required: false, type: "number" },
    { name: "MAX_ORGS_PER_USER", description: "Maximum orgs a user can own", defaultValue: "10", required: false, type: "number" },

    // ── OAuth: GitHub ─────────────────────────────────
    { name: "OAUTH_GITHUB_CLIENT_ID", description: "GitHub OAuth app client ID", defaultValue: "", required: false, type: "string" },
    { name: "OAUTH_GITHUB_CLIENT_SECRET", description: "GitHub OAuth app client secret", defaultValue: "", required: false, type: "string" },

    // ── OAuth: Google ─────────────────────────────────
    { name: "OAUTH_GOOGLE_CLIENT_ID", description: "Google OAuth client ID", defaultValue: "", required: false, type: "string" },
    { name: "OAUTH_GOOGLE_CLIENT_SECRET", description: "Google OAuth client secret", defaultValue: "", required: false, type: "string" },

    // ── OAuth: GitLab ─────────────────────────────────
    { name: "OAUTH_GITLAB_CLIENT_ID", description: "GitLab OAuth application ID", defaultValue: "", required: false, type: "string" },
    { name: "OAUTH_GITLAB_CLIENT_SECRET", description: "GitLab OAuth application secret", defaultValue: "", required: false, type: "string" },

    // ── OAuth: Bitbucket ──────────────────────────────
    { name: "OAUTH_BITBUCKET_CLIENT_ID", description: "Bitbucket OAuth consumer key", defaultValue: "", required: false, type: "string" },
    { name: "OAUTH_BITBUCKET_CLIENT_SECRET", description: "Bitbucket OAuth consumer secret", defaultValue: "", required: false, type: "string" },

    // ── SMTP ──────────────────────────────────────────
    { name: "SMTP_HOST", description: "SMTP server hostname", defaultValue: "localhost", required: false, type: "string" },
    { name: "SMTP_PORT", description: "SMTP server port", defaultValue: "587", required: false, type: "number" },
    { name: "SMTP_SECURE", description: "Use TLS for SMTP", defaultValue: "false", required: false, type: "boolean" },
    { name: "SMTP_USER", description: "SMTP authentication user", defaultValue: "", required: false, type: "string" },
    { name: "SMTP_PASSWORD", description: "SMTP authentication password", defaultValue: "", required: false, type: "string" },
    { name: "SMTP_FROM", description: "Default sender address", defaultValue: "noreply@localhost", required: false, type: "string" },

    // ── Cluster ───────────────────────────────────────
    { name: "CLUSTER_TOKEN", description: "Shared secret for cluster node auth", defaultValue: "dev-cluster-token", required: false, type: "string" },
    { name: "CLUSTER_HEARTBEAT_INTERVAL_MS", description: "Heartbeat interval in ms", defaultValue: "10000", required: false, type: "number" },
    { name: "CLUSTER_NODE_TIMEOUT_MS", description: "Node considered offline after ms", defaultValue: "30000", required: false, type: "number" },
    { name: "CLUSTER_MAX_JOBS_PER_NODE", description: "Max concurrent jobs per node", defaultValue: "4", required: false, type: "number" },

    // ── Node Forwarding ───────────────────────────────
    { name: "NODE_FORWARD_URL", description: "Forward all requests to this node URL (optional)", defaultValue: "", required: false, type: "string" },

    // ── AI ────────────────────────────────────────────
    { name: "AI_ENABLED", description: "Enable AI features", defaultValue: "true", required: false, type: "boolean" },
    { name: "AI_RATE_LIMIT_PER_MINUTE", description: "AI requests per minute per user", defaultValue: "30", required: false, type: "number" },
    { name: "AI_MODEL", description: "Default AI model identifier", defaultValue: "gpt-4", required: false, type: "string" },
    { name: "AI_API_KEY", description: "API key for AI provider", defaultValue: "", required: false, type: "string" },
    { name: "AI_MAX_TOKENS", description: "Max tokens per AI request", defaultValue: "4096", required: false, type: "number" },

    // ── WebSocket ─────────────────────────────────────
    { name: "WS_PORT", description: "WebSocket server port", defaultValue: "3001", required: false, type: "number" },

    // ── App.ini ───────────────────────────────────────
    { name: "APP_INI_PATH", description: "Path to app.ini config file", defaultValue: "", required: false, type: "string" },
    { name: "CONFIG_DIR", description: "Directory containing config files", defaultValue: ".", required: false, type: "string" },
];

/**
 * Validate environment variables against the schema.
 * Returns an array of error messages (empty = valid).
 */
export function validateEnv(
    env: Record<string, string | undefined> = process.env,
): string[] {
    const errors: string[] = [];

    for (const def of ENV_SCHEMA) {
        const value = env[def.name];

        if (def.required && (value === undefined || value === "")) {
            errors.push(`Missing required environment variable: ${def.name} – ${def.description}`);
            continue;
        }

        const resolved = value ?? def.defaultValue;
        if (resolved === undefined) continue;

        if (def.type === "number" && isNaN(Number(resolved))) {
            errors.push(`${def.name} must be a valid number, got "${resolved}"`);
        }
        if (def.type === "boolean" && resolved !== "true" && resolved !== "false") {
            errors.push(`${def.name} must be "true" or "false", got "${resolved}"`);
        }
    }

    return errors;
}

/**
 * Get the default value for a given env var name, or undefined if not in schema.
 */
export function getEnvDefault(name: string): string | undefined {
    const def = ENV_SCHEMA.find((d) => d.name === name);
    return def?.defaultValue;
}
