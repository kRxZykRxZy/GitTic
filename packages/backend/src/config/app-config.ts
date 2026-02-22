import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { type PlatformConfig, loadConfig } from "@platform/shared";

/**
 * Extended application configuration that includes OAuth, SMTP,
 * storage limits, and other settings beyond the base PlatformConfig.
 */
export interface AppConfig extends PlatformConfig {
    repoStoragePath: string;
    /** Maximum repositories allowed per user */
    maxReposPerUser: number;
    /** Maximum organizations a user can own */
    maxOrgsPerUser: number;
    /** Data directory for all persistent storage */
    dataDir: string;
    /** Whether Redis is enabled */
    redisEnabled: boolean;
    /** OAuth provider credentials */
    oauth: {
        github: { clientId: string; clientSecret: string };
        google: { clientId: string; clientSecret: string };
        gitlab: { clientId: string; clientSecret: string };
        bitbucket: { clientId: string; clientSecret: string };
    };
    /** SMTP mail settings */
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        from: string;
    };
    /** Cluster-specific settings */
    clusterSettings: {
        heartbeatIntervalMs: number;
        nodeTimeoutMs: number;
        maxJobsPerNode: number;
    };
    /** AI-specific settings */
    aiSettings: {
        model: string;
        apiKey: string;
        maxTokens: number;
    };
}

/** Singleton instance */
let _config: AppConfig | null = null;

/**
 * Parse a simple app.ini file into key-value pairs.
 * Supports `[section]` headers and `key = value` lines.
 * Section-qualified keys are emitted as `SECTION_KEY` (uppercased).
 */
function parseIniFile(filePath: string): Record<string, string> {
    const result: Record<string, string> = {};
    if (!existsSync(filePath)) return result;

    const content = readFileSync(filePath, "utf-8");
    let currentSection = "";

    for (const raw of content.split("\n")) {
        const line = raw.trim();
        if (!line || line.startsWith("#") || line.startsWith(";")) continue;

        const sectionMatch = line.match(/^\[(.+)]$/);
        if (sectionMatch) {
            currentSection = sectionMatch[1].toUpperCase();
            continue;
        }

        const eqIdx = line.indexOf("=");
        if (eqIdx === -1) continue;

        const key = line.slice(0, eqIdx).trim().toUpperCase();
        const value = line.slice(eqIdx + 1).trim();
        const fullKey = currentSection ? `${currentSection}_${key}` : key;
        result[fullKey] = value;
    }

    return result;
}

/**
 * Build the full AppConfig by merging env vars, optional app.ini,
 * and the base PlatformConfig from @platform/shared.
 */
function buildConfig(): AppConfig {
    const iniPath = resolve(
        process.env.APP_INI_PATH || process.env.CONFIG_DIR || ".",
        "app.ini",
    );
    const iniVars = parseIniFile(iniPath);

    // Ini values serve as fallback; env vars always win
    const merged: Record<string, string | undefined> = { ...iniVars };
    for (const [k, v] of Object.entries(process.env)) {
        if (v !== undefined) merged[k] = v;
    }

    const base = loadConfig(merged);

    return {
        ...base,
        repoStoragePath: merged.REPO_STORAGE_PATH || "./data/repos",
        maxReposPerUser: parseInt(merged.MAX_REPOS_PER_USER || "50", 10),
        maxOrgsPerUser: parseInt(merged.MAX_ORGS_PER_USER || "10", 10),
        dataDir: merged.DATA_DIR || "./data",
        redisEnabled: merged.REDIS_ENABLED === "true",
        oauth: {
            github: {
                clientId: merged.OAUTH_GITHUB_CLIENT_ID || "",
                clientSecret: merged.OAUTH_GITHUB_CLIENT_SECRET || "",
            },
            google: {
                clientId: merged.OAUTH_GOOGLE_CLIENT_ID || "",
                clientSecret: merged.OAUTH_GOOGLE_CLIENT_SECRET || "",
            },
            gitlab: {
                clientId: merged.OAUTH_GITLAB_CLIENT_ID || "",
                clientSecret: merged.OAUTH_GITLAB_CLIENT_SECRET || "",
            },
            bitbucket: {
                clientId: merged.OAUTH_BITBUCKET_CLIENT_ID || "",
                clientSecret: merged.OAUTH_BITBUCKET_CLIENT_SECRET || "",
            },
        },
        smtp: {
            host: merged.SMTP_HOST || "localhost",
            port: parseInt(merged.SMTP_PORT || "587", 10),
            secure: merged.SMTP_SECURE === "true",
            user: merged.SMTP_USER || "",
            password: merged.SMTP_PASSWORD || "",
            from: merged.SMTP_FROM || "noreply@localhost",
        },
        clusterSettings: {
            heartbeatIntervalMs: parseInt(merged.CLUSTER_HEARTBEAT_INTERVAL_MS || "10000", 10),
            nodeTimeoutMs: parseInt(merged.CLUSTER_NODE_TIMEOUT_MS || "30000", 10),
            maxJobsPerNode: parseInt(merged.CLUSTER_MAX_JOBS_PER_NODE || "4", 10),
        },
        aiSettings: {
            model: merged.AI_MODEL || "gpt-4",
            apiKey: merged.AI_API_KEY || "",
            maxTokens: parseInt(merged.AI_MAX_TOKENS || "4096", 10),
        },
    };
}

/**
 * Returns the singleton AppConfig, building it on first call.
 * Thread-safe in single-threaded Node.js context.
 */
export function getConfig(): AppConfig {
    if (!_config) {
        _config = buildConfig();
    }
    return _config;
}

/**
 * Reset the cached config (useful for testing).
 * @internal
 */
export function resetConfig(): void {
    _config = null;
}
