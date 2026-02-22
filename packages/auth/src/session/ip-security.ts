/**
 * IP-based security for authentication.
 * Provides IP allowlisting/blocklisting, rate limiting per IP,
 * suspicious IP tracking, and geo-detection placeholders.
 * @module session/ip-security
 */

/**
 * IP list entry with metadata.
 */
export interface IpListEntry {
  /** IP address or CIDR range */
  ip: string;
  /** Reason for listing */
  reason: string;
  /** Who added this entry */
  addedBy: string;
  /** When the entry was added */
  addedAt: number;
  /** When the entry expires (null for permanent) */
  expiresAt: number | null;
}

/**
 * Rate limit record for an IP address.
 */
export interface IpRateLimitRecord {
  /** IP address */
  ip: string;
  /** Number of attempts in the current window */
  attempts: number;
  /** Window start timestamp */
  windowStart: number;
  /** Whether the IP is currently blocked */
  blocked: boolean;
  /** When the block expires */
  blockedUntil: number | null;
}

/**
 * Suspicious IP activity record.
 */
export interface SuspiciousIpRecord {
  /** IP address */
  ip: string;
  /** Number of failed login attempts */
  failedAttempts: number;
  /** Targeted user IDs */
  targetedUsers: string[];
  /** First suspicious activity timestamp */
  firstSeenAt: number;
  /** Last suspicious activity timestamp */
  lastSeenAt: number;
  /** Risk score (0-100) */
  riskScore: number;
}

/**
 * Geo-location information for an IP address (placeholder).
 */
export interface GeoLocation {
  /** Country code (ISO 3166-1 alpha-2) */
  countryCode: string | null;
  /** Country name */
  country: string | null;
  /** Region/state */
  region: string | null;
  /** City */
  city: string | null;
  /** Approximate latitude */
  latitude: number | null;
  /** Approximate longitude */
  longitude: number | null;
}

/**
 * IP security check result.
 */
export interface IpSecurityCheck {
  /** Whether the IP is allowed to proceed */
  allowed: boolean;
  /** Reason for denial (if not allowed) */
  reason: string | null;
  /** Whether the IP is rate-limited */
  rateLimited: boolean;
  /** Whether the IP is blocklisted */
  blocklisted: boolean;
  /** Whether the IP is on the allowlist */
  allowlisted: boolean;
}

/**
 * Configuration for IP security.
 */
export interface IpSecurityConfig {
  /** Maximum attempts per window before rate limiting */
  maxAttempts?: number;
  /** Rate limit window in milliseconds */
  windowMs?: number;
  /** Block duration in milliseconds after exceeding rate limit */
  blockDurationMs?: number;
  /** Whether to enforce the allowlist (if empty, all IPs are allowed) */
  enforceAllowlist?: boolean;
  /** Threshold of failed attempts to flag as suspicious */
  suspiciousThreshold?: number;
}

/**
 * Default IP security configuration.
 */
const DEFAULTS: Required<IpSecurityConfig> = {
  maxAttempts: 10,
  windowMs: 15 * 60 * 1000,
  blockDurationMs: 30 * 60 * 1000,
  enforceAllowlist: false,
  suspiciousThreshold: 5,
};

/**
 * IP security manager for authentication protection.
 */
export class IpSecurityManager {
  private readonly allowlist = new Map<string, IpListEntry>();
  private readonly blocklist = new Map<string, IpListEntry>();
  private readonly rateLimits = new Map<string, IpRateLimitRecord>();
  private readonly suspicious = new Map<string, SuspiciousIpRecord>();
  private readonly config: Required<IpSecurityConfig>;

  /**
   * Create a new IP security manager.
   * @param config - IP security configuration
   */
  constructor(config: IpSecurityConfig = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? DEFAULTS.maxAttempts,
      windowMs: config.windowMs ?? DEFAULTS.windowMs,
      blockDurationMs: config.blockDurationMs ?? DEFAULTS.blockDurationMs,
      enforceAllowlist:
        config.enforceAllowlist ?? DEFAULTS.enforceAllowlist,
      suspiciousThreshold:
        config.suspiciousThreshold ?? DEFAULTS.suspiciousThreshold,
    };
  }

  /**
   * Add an IP to the allowlist.
   * @param ip - IP address
   * @param reason - Reason for allowlisting
   * @param addedBy - Who added the entry
   * @param expiresAt - Optional expiration timestamp
   */
  addToAllowlist(
    ip: string,
    reason: string,
    addedBy: string,
    expiresAt?: number
  ): void {
    this.allowlist.set(ip, {
      ip,
      reason,
      addedBy,
      addedAt: Date.now(),
      expiresAt: expiresAt ?? null,
    });
  }

  /**
   * Remove an IP from the allowlist.
   * @param ip - IP address to remove
   * @returns True if the IP was removed
   */
  removeFromAllowlist(ip: string): boolean {
    return this.allowlist.delete(ip);
  }

  /**
   * Add an IP to the blocklist.
   * @param ip - IP address
   * @param reason - Reason for blocklisting
   * @param addedBy - Who added the entry
   * @param expiresAt - Optional expiration timestamp
   */
  addToBlocklist(
    ip: string,
    reason: string,
    addedBy: string,
    expiresAt?: number
  ): void {
    this.blocklist.set(ip, {
      ip,
      reason,
      addedBy,
      addedAt: Date.now(),
      expiresAt: expiresAt ?? null,
    });
  }

  /**
   * Remove an IP from the blocklist.
   * @param ip - IP address to remove
   * @returns True if the IP was removed
   */
  removeFromBlocklist(ip: string): boolean {
    return this.blocklist.delete(ip);
  }

  /**
   * Check if an IP is on the blocklist (and not expired).
   * @param ip - IP address to check
   * @returns True if blocklisted
   */
  isBlocklisted(ip: string): boolean {
    const entry = this.blocklist.get(ip);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.blocklist.delete(ip);
      return false;
    }
    return true;
  }

  /**
   * Check if an IP is on the allowlist (and not expired).
   * @param ip - IP address to check
   * @returns True if allowlisted
   */
  isAllowlisted(ip: string): boolean {
    const entry = this.allowlist.get(ip);
    if (!entry) return false;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.allowlist.delete(ip);
      return false;
    }
    return true;
  }

  /**
   * Record a login attempt from an IP for rate limiting.
   * @param ip - IP address
   * @returns Whether the attempt is allowed (not rate-limited)
   */
  recordAttempt(ip: string): boolean {
    const now = Date.now();
    let record = this.rateLimits.get(ip);

    if (!record) {
      record = {
        ip,
        attempts: 0,
        windowStart: now,
        blocked: false,
        blockedUntil: null,
      };
      this.rateLimits.set(ip, record);
    }

    // Check if currently blocked
    if (record.blocked) {
      if (record.blockedUntil && now > record.blockedUntil) {
        record.blocked = false;
        record.blockedUntil = null;
        record.attempts = 0;
        record.windowStart = now;
      } else {
        return false;
      }
    }

    // Check if window has expired
    if (now - record.windowStart > this.config.windowMs) {
      record.attempts = 0;
      record.windowStart = now;
    }

    record.attempts++;

    if (record.attempts > this.config.maxAttempts) {
      record.blocked = true;
      record.blockedUntil = now + this.config.blockDurationMs;
      return false;
    }

    return true;
  }

  /**
   * Record a failed login attempt and track suspicious IPs.
   * @param ip - IP address
   * @param targetUserId - User ID that was targeted
   */
  recordFailedAttempt(ip: string, targetUserId: string): void {
    const now = Date.now();
    let record = this.suspicious.get(ip);

    if (!record) {
      record = {
        ip,
        failedAttempts: 0,
        targetedUsers: [],
        firstSeenAt: now,
        lastSeenAt: now,
        riskScore: 0,
      };
      this.suspicious.set(ip, record);
    }

    record.failedAttempts++;
    record.lastSeenAt = now;

    if (!record.targetedUsers.includes(targetUserId)) {
      record.targetedUsers.push(targetUserId);
    }

    // Calculate risk score
    record.riskScore = Math.min(
      100,
      record.failedAttempts * 10 +
        record.targetedUsers.length * 20
    );
  }

  /**
   * Perform a comprehensive IP security check.
   * @param ip - IP address to check
   * @returns Security check result
   */
  checkIp(ip: string): IpSecurityCheck {
    // Check blocklist
    if (this.isBlocklisted(ip)) {
      return {
        allowed: false,
        reason: "IP is blocklisted",
        rateLimited: false,
        blocklisted: true,
        allowlisted: false,
      };
    }

    // Check allowlist enforcement
    const allowlisted = this.isAllowlisted(ip);
    if (this.config.enforceAllowlist && !allowlisted) {
      return {
        allowed: false,
        reason: "IP is not on the allowlist",
        rateLimited: false,
        blocklisted: false,
        allowlisted: false,
      };
    }

    // Check rate limiting
    const rateLimitRecord = this.rateLimits.get(ip);
    if (rateLimitRecord?.blocked) {
      const now = Date.now();
      if (
        !rateLimitRecord.blockedUntil ||
        now <= rateLimitRecord.blockedUntil
      ) {
        return {
          allowed: false,
          reason: "IP is rate limited",
          rateLimited: true,
          blocklisted: false,
          allowlisted,
        };
      }
    }

    return {
      allowed: true,
      reason: null,
      rateLimited: false,
      blocklisted: false,
      allowlisted,
    };
  }

  /**
   * Get suspicious IP records above a risk score threshold.
   * @param minRiskScore - Minimum risk score (default: 50)
   * @returns Array of suspicious IP records
   */
  getSuspiciousIps(minRiskScore: number = 50): SuspiciousIpRecord[] {
    const results: SuspiciousIpRecord[] = [];
    for (const record of this.suspicious.values()) {
      if (record.riskScore >= minRiskScore) {
        results.push({ ...record });
      }
    }
    return results.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * Placeholder for geo-location lookup.
   * In production, this would call an IP geolocation service.
   * @param _ip - IP address to look up
   * @returns Geo-location stub
   */
  lookupGeoLocation(_ip: string): GeoLocation {
    return {
      countryCode: null,
      country: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
    };
  }

  /**
   * Reset rate limiting for an IP.
   * @param ip - IP address to reset
   */
  resetRateLimit(ip: string): void {
    this.rateLimits.delete(ip);
  }

  /**
   * Clean up expired entries from all lists.
   * @returns Number of entries cleaned up
   */
  cleanup(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [ip, entry] of this.allowlist) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.allowlist.delete(ip);
        cleaned++;
      }
    }

    for (const [ip, entry] of this.blocklist) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.blocklist.delete(ip);
        cleaned++;
      }
    }

    for (const [ip, record] of this.rateLimits) {
      if (
        !record.blocked &&
        now - record.windowStart > this.config.windowMs
      ) {
        this.rateLimits.delete(ip);
        cleaned++;
      }
    }

    return cleaned;
  }
}
