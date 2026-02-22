/**
 * AI configuration module.
 *
 * Provides centralized configuration for AI model interactions,
 * including rate limits, timeouts, retry policies, and temperature
 * presets per task type.
 *
 * @module config
 */

/**
 * Temperature presets for different AI task types.
 * Lower values produce more deterministic output.
 */
export interface TemperaturePresets {
  /** Code generation tasks (low creativity). */
  readonly codeGeneration: number;
  /** Code review and analysis (very deterministic). */
  readonly codeReview: number;
  /** Commit message generation. */
  readonly commitMessage: number;
  /** Documentation generation. */
  readonly documentation: number;
  /** Chat conversations (moderate creativity). */
  readonly chat: number;
  /** Creative writing tasks (higher creativity). */
  readonly creative: number;
  /** Classification and tagging (deterministic). */
  readonly classification: number;
}

/**
 * Retry configuration for failed API calls.
 */
export interface RetryConfig {
  /** Maximum number of retry attempts. */
  readonly maxRetries: number;
  /** Base delay in milliseconds between retries. */
  readonly baseDelayMs: number;
  /** Maximum delay in milliseconds between retries. */
  readonly maxDelayMs: number;
  /** Exponential backoff multiplier. */
  readonly backoffMultiplier: number;
  /** HTTP status codes that should trigger a retry. */
  readonly retryableStatusCodes: readonly number[];
}

/**
 * Rate limit configuration per user.
 */
export interface RateLimitConfig {
  /** Maximum requests per window. */
  readonly maxRequests: number;
  /** Window duration in milliseconds. */
  readonly windowMs: number;
  /** Maximum burst requests allowed. */
  readonly burstLimit: number;
}

/**
 * Complete AI configuration interface.
 */
export interface AiConfig {
  /** Default model identifier. */
  readonly defaultModel: string;
  /** Fallback model when the default is unavailable. */
  readonly fallbackModel: string;
  /** Request timeout in milliseconds. */
  readonly timeoutMs: number;
  /** Maximum tokens for response generation. */
  readonly maxTokens: number;
  /** Maximum context window size in tokens. */
  readonly maxContextTokens: number;
  /** Temperature presets by task type. */
  readonly temperaturePresets: TemperaturePresets;
  /** Retry configuration. */
  readonly retry: RetryConfig;
  /** Rate limit configuration. */
  readonly rateLimit: RateLimitConfig;
  /** Whether to enable response caching. */
  readonly enableCache: boolean;
  /** Cache TTL in milliseconds. */
  readonly cacheTtlMs: number;
  /** Maximum number of cached entries. */
  readonly maxCacheEntries: number;
  /** Base URL for the AI API. */
  readonly apiBaseUrl: string;
}

/**
 * Default temperature presets for various task types.
 * Tuned for optimal output quality per use case.
 */
export const DEFAULT_TEMPERATURE_PRESETS: TemperaturePresets = {
  codeGeneration: 0.2,
  codeReview: 0.1,
  commitMessage: 0.3,
  documentation: 0.4,
  chat: 0.7,
  creative: 0.9,
  classification: 0.1,
} as const;

/**
 * Default retry configuration with exponential backoff.
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30_000,
  backoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
} as const;

/**
 * Default rate limit configuration.
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 60_000,
  burstLimit: 5,
} as const;

/**
 * Default AI configuration with sensible production values.
 */
export const DEFAULT_AI_CONFIG: AiConfig = {
  defaultModel: "openai",
  fallbackModel: "mistral",
  timeoutMs: 30_000,
  maxTokens: 2048,
  maxContextTokens: 128_000,
  temperaturePresets: DEFAULT_TEMPERATURE_PRESETS,
  retry: DEFAULT_RETRY_CONFIG,
  rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
  enableCache: true,
  cacheTtlMs: 300_000,
  maxCacheEntries: 1000,
  apiBaseUrl: "https://text.pollinations.ai",
} as const;

/**
 * Resolves the temperature for a given task type from presets.
 *
 * @param taskType - The task type key from TemperaturePresets.
 * @param presets - Optional custom presets; uses defaults if omitted.
 * @returns The temperature value for the task type.
 */
export function getTemperatureForTask(
  taskType: keyof TemperaturePresets,
  presets: TemperaturePresets = DEFAULT_TEMPERATURE_PRESETS
): number {
  return presets[taskType];
}

/**
 * Creates a merged AI configuration from partial overrides.
 *
 * Deep-merges the provided overrides onto the default config,
 * preserving any unspecified default values.
 *
 * @param overrides - Partial configuration overrides.
 * @returns A complete AiConfig with defaults applied.
 */
export function createAiConfig(overrides: Partial<AiConfig> = {}): AiConfig {
  return {
    ...DEFAULT_AI_CONFIG,
    ...overrides,
    temperaturePresets: {
      ...DEFAULT_AI_CONFIG.temperaturePresets,
      ...(overrides.temperaturePresets ?? {}),
    },
    retry: {
      ...DEFAULT_AI_CONFIG.retry,
      ...(overrides.retry ?? {}),
    },
    rateLimit: {
      ...DEFAULT_AI_CONFIG.rateLimit,
      ...(overrides.rateLimit ?? {}),
    },
  };
}

/**
 * Calculates retry delay with exponential backoff and jitter.
 *
 * @param attempt - The current retry attempt (0-indexed).
 * @param config - Retry configuration.
 * @returns Delay in milliseconds before the next retry.
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const exponentialDelay =
    config.baseDelayMs * Math.pow(config.backoffMultiplier, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);
  const jitter = Math.random() * cappedDelay * 0.1;
  return Math.floor(cappedDelay + jitter);
}

/**
 * Validates an AI configuration for correctness.
 *
 * @param config - The configuration to validate.
 * @returns An array of validation error messages (empty if valid).
 */
export function validateAiConfig(config: AiConfig): string[] {
  const errors: string[] = [];

  if (config.timeoutMs <= 0) {
    errors.push("timeoutMs must be positive");
  }
  if (config.maxTokens <= 0) {
    errors.push("maxTokens must be positive");
  }
  if (config.maxContextTokens <= 0) {
    errors.push("maxContextTokens must be positive");
  }
  if (config.retry.maxRetries < 0) {
    errors.push("maxRetries must be non-negative");
  }
  if (config.retry.baseDelayMs <= 0) {
    errors.push("baseDelayMs must be positive");
  }
  if (config.rateLimit.maxRequests <= 0) {
    errors.push("maxRequests must be positive");
  }
  if (config.rateLimit.windowMs <= 0) {
    errors.push("windowMs must be positive");
  }

  const presets = config.temperaturePresets;
  for (const [key, value] of Object.entries(presets)) {
    if (value < 0 || value > 2) {
      errors.push(`Temperature preset '${key}' must be between 0 and 2`);
    }
  }

  return errors;
}
