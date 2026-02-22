"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadConfig = loadConfig;
/**
 * Load configuration from environment variables.
 */
function loadConfig(env = process.env) {
    return {
        nodeEnv: env.NODE_ENV || "development",
        port: parseInt(env.PORT || "3000", 10),
        host: env.HOST || "0.0.0.0",
        db: {
            driver: env.DB_DRIVER || "sqlite",
            sqlitePath: env.SQLITE_PATH || "./data/platform.sqlite",
            postgres: env.DB_DRIVER === "postgres"
                ? {
                    host: env.POSTGRES_HOST || "localhost",
                    port: parseInt(env.POSTGRES_PORT || "5432", 10),
                    user: env.POSTGRES_USER || "platform",
                    password: env.POSTGRES_PASSWORD || "",
                    database: env.POSTGRES_DB || "platform",
                }
                : undefined,
        },
        jwt: {
            secret: env.JWT_SECRET || "dev-secret-change-me",
            expiresIn: env.JWT_EXPIRES_IN || "7d",
        },
        redis: env.REDIS_URL ? { url: env.REDIS_URL } : undefined,
        git: {
            storagePath: env.GIT_STORAGE_PATH || "./data/repos",
        },
        cluster: {
            token: env.CLUSTER_TOKEN || "dev-cluster-token",
        },
        ai: {
            enabled: env.AI_ENABLED !== "false",
            rateLimitPerMinute: parseInt(env.AI_RATE_LIMIT_PER_MINUTE || "30", 10),
        },
        ws: {
            port: parseInt(env.WS_PORT || "3001", 10),
        },
        csrf: {
            secret: env.CSRF_SECRET || "dev-csrf-secret",
        },
        logLevel: env.LOG_LEVEL || "info",
    };
}
//# sourceMappingURL=config.js.map