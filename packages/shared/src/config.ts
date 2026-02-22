/** Environment-based configuration */
export interface PlatformConfig {
  nodeEnv: string;
  port: number;
  host: string;
  db: DbConfig;
  jwt: JwtConfig;
  redis?: RedisConfig;
  git: GitConfig;
  cluster: ClusterConfig;
  ai: AiConfig;
  ws: WsConfig;
  csrf: CsrfConfig;
  logLevel: string;
}

export interface DbConfig {
  driver: "sqlite" | "postgres";
  sqlitePath?: string;
  postgres?: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface RedisConfig {
  url: string;
}

export interface GitConfig {
  storagePath: string;
}

export interface ClusterConfig {
  token: string;
}

export interface AiConfig {
  enabled: boolean;
  rateLimitPerMinute: number;
}

export interface WsConfig {
  port: number;
}

export interface CsrfConfig {
  secret: string;
}

/**
 * Load configuration from environment variables.
 */
export function loadConfig(env: Record<string, string | undefined> = process.env): PlatformConfig {
  return {
    nodeEnv: env.NODE_ENV || "development",
    port: parseInt(env.PORT || "3000", 10),
    host: env.HOST || "0.0.0.0",
    db: {
      driver: (env.DB_DRIVER as "sqlite" | "postgres") || "sqlite",
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
