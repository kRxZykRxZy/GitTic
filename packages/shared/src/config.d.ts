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
export declare function loadConfig(env?: Record<string, string | undefined>): PlatformConfig;
//# sourceMappingURL=config.d.ts.map