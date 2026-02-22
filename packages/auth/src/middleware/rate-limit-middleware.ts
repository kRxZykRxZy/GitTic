/**
 * Auth-specific rate limiting middleware.
 * Provides configurable rate limiting for login attempts,
 * password reset requests, and token refresh operations.
 * @module middleware/rate-limit-middleware
 */

/**
 * Rate limit action types that can be independently configured.
 */
export type RateLimitAction = "login" | "password_reset" | "token_refresh" | "register" | "mfa_verify";

/**
 * Configuration for a single rate limit rule.
 */
export interface RateLimitRule {
  /** Maximum number of attempts in the window */
  maxAttempts: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Block duration in milliseconds after exceeding the limit */
  blockDurationMs: number;
  /** Whether to include the action type in the rate limit key */
  perAction: boolean;
  /** Custom message to return when rate limited */
  message?: string;
}

/**
 * Rate limit tracking entry for a specific key.
 */
interface RateLimitEntry {
  /** Number of attempts in current window */
  attempts: number;
  /** Window start timestamp */
  windowStart: number;
  /** Whether currently blocked */
  blocked: boolean;
  /** Block expiration timestamp */
  blockedUntil: number | null;
  /** Remaining attempts */
  remaining: number;
}

/**
 * Result of a rate limit check.
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Number of remaining attempts */
  remaining: number;
  /** When the rate limit resets (timestamp) */
  resetAt: number;
  /** How long until the block expires (milliseconds), or 0 */
  retryAfterMs: number;
  /** Message to return to the client */
  message: string | null;
}

/**
 * Rate limit middleware configuration.
 */
export interface RateLimitConfig {
  /** Rules for each action type */
  rules: Partial<Record<RateLimitAction, RateLimitRule>>;
  /** Whether to use IP + action as key (vs just IP) */
  keyByIpAndAction?: boolean;
  /** Custom key generator */
  keyGenerator?: (identifier: string, action: RateLimitAction) => string;
}

/**
 * Default rate limit rules for each action.
 */
const DEFAULT_RULES: Record<RateLimitAction, RateLimitRule> = {
  login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000,
    blockDurationMs: 30 * 60 * 1000,
    perAction: true,
    message: "Too many login attempts. Please try again later.",
  },
  password_reset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 60 * 60 * 1000,
    perAction: true,
    message: "Too many password reset requests. Please try again later.",
  },
  token_refresh: {
    maxAttempts: 30,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
    perAction: true,
    message: "Too many token refresh requests. Please try again later.",
  },
  register: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000,
    blockDurationMs: 2 * 60 * 60 * 1000,
    perAction: true,
    message: "Too many registration attempts. Please try again later.",
  },
  mfa_verify: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000,
    blockDurationMs: 15 * 60 * 1000,
    perAction: true,
    message: "Too many MFA verification attempts. Please try again later.",
  },
};

/**
 * Auth rate limiter managing rate limits for authentication actions.
 */
export class AuthRateLimiter {
  private readonly entries = new Map<string, RateLimitEntry>();
  private readonly rules: Record<RateLimitAction, RateLimitRule>;
  private readonly keyGenerator: (
    identifier: string,
    action: RateLimitAction
  ) => string;

  /**
   * Create a new auth rate limiter.
   * @param config - Rate limit configuration
   */
  constructor(config: RateLimitConfig = { rules: {} }) {
    this.rules = {
      ...DEFAULT_RULES,
      ...config.rules,
    };

    this.keyGenerator =
      config.keyGenerator ??
      ((identifier, action) => `${action}:${identifier}`);
  }

  /**
   * Check and record an attempt for rate limiting.
   * @param identifier - Client identifier (usually IP address)
   * @param action - The action being rate limited
   * @returns Rate limit check result
   */
  checkLimit(
    identifier: string,
    action: RateLimitAction
  ): RateLimitResult {
    const rule = this.rules[action];
    const key = this.keyGenerator(identifier, action);
    const now = Date.now();

    let entry = this.entries.get(key);

    if (!entry) {
      entry = {
        attempts: 0,
        windowStart: now,
        blocked: false,
        blockedUntil: null,
        remaining: rule.maxAttempts,
      };
      this.entries.set(key, entry);
    }

    // Check if block has expired
    if (entry.blocked && entry.blockedUntil) {
      if (now > entry.blockedUntil) {
        entry.blocked = false;
        entry.blockedUntil = null;
        entry.attempts = 0;
        entry.windowStart = now;
        entry.remaining = rule.maxAttempts;
      } else {
        return {
          allowed: false,
          remaining: 0,
          resetAt: entry.blockedUntil,
          retryAfterMs: entry.blockedUntil - now,
          message: rule.message ?? "Rate limit exceeded",
        };
      }
    }

    // Check if window has expired
    if (now - entry.windowStart > rule.windowMs) {
      entry.attempts = 0;
      entry.windowStart = now;
    }

    entry.attempts++;
    entry.remaining = Math.max(0, rule.maxAttempts - entry.attempts);

    // Check if limit exceeded
    if (entry.attempts > rule.maxAttempts) {
      entry.blocked = true;
      entry.blockedUntil = now + rule.blockDurationMs;
      entry.remaining = 0;

      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfterMs: rule.blockDurationMs,
        message: rule.message ?? "Rate limit exceeded",
      };
    }

    return {
      allowed: true,
      remaining: entry.remaining,
      resetAt: entry.windowStart + rule.windowMs,
      retryAfterMs: 0,
      message: null,
    };
  }

  /**
   * Record a successful attempt (resets the counter for the action).
   * @param identifier - Client identifier
   * @param action - The action
   */
  recordSuccess(identifier: string, action: RateLimitAction): void {
    const key = this.keyGenerator(identifier, action);
    this.entries.delete(key);
  }

  /**
   * Reset rate limit for a specific identifier and action.
   * @param identifier - Client identifier
   * @param action - The action to reset
   */
  reset(identifier: string, action: RateLimitAction): void {
    const key = this.keyGenerator(identifier, action);
    this.entries.delete(key);
  }

  /**
   * Reset all rate limits for an identifier.
   * @param identifier - Client identifier
   */
  resetAll(identifier: string): void {
    const actions: RateLimitAction[] = [
      "login",
      "password_reset",
      "token_refresh",
      "register",
      "mfa_verify",
    ];
    for (const action of actions) {
      this.reset(identifier, action);
    }
  }

  /**
   * Get the current rate limit status without recording an attempt.
   * @param identifier - Client identifier
   * @param action - The action to check
   * @returns Current rate limit status
   */
  getStatus(
    identifier: string,
    action: RateLimitAction
  ): RateLimitResult {
    const rule = this.rules[action];
    const key = this.keyGenerator(identifier, action);
    const entry = this.entries.get(key);
    const now = Date.now();

    if (!entry) {
      return {
        allowed: true,
        remaining: rule.maxAttempts,
        resetAt: now + rule.windowMs,
        retryAfterMs: 0,
        message: null,
      };
    }

    if (entry.blocked && entry.blockedUntil && now <= entry.blockedUntil) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.blockedUntil,
        retryAfterMs: entry.blockedUntil - now,
        message: rule.message ?? "Rate limit exceeded",
      };
    }

    return {
      allowed: true,
      remaining: entry.remaining,
      resetAt: entry.windowStart + rule.windowMs,
      retryAfterMs: 0,
      message: null,
    };
  }

  /**
   * Clean up expired rate limit entries.
   * @returns Number of entries cleaned up
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.entries) {
      const isWindowExpired = now - entry.windowStart > 2 * 60 * 60 * 1000;
      const isBlockExpired =
        entry.blocked && entry.blockedUntil && now > entry.blockedUntil;

      if (isWindowExpired || isBlockExpired) {
        this.entries.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
