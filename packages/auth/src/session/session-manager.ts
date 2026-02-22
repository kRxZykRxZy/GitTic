/**
 * Session management for authenticated users.
 * Provides creation, validation, extension, invalidation,
 * and listing of active sessions per user.
 * @module session/session-manager
 */

import { randomBytes, createHash } from "node:crypto";

/**
 * Session record storing session data.
 */
export interface SessionRecord {
  /** Unique session ID */
  id: string;
  /** User ID this session belongs to */
  userId: string;
  /** SHA-256 hash of the session token */
  tokenHash: string;
  /** IP address of the client */
  ipAddress: string;
  /** User agent string of the client */
  userAgent: string;
  /** Device identifier (fingerprint) */
  deviceId: string | null;
  /** Creation timestamp */
  createdAt: number;
  /** Last activity timestamp */
  lastActivityAt: number;
  /** Absolute expiration timestamp */
  expiresAt: number;
  /** Whether the session is active */
  active: boolean;
  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Result of creating a new session.
 */
export interface CreateSessionResult {
  /** Plain-text session token (sent to client) */
  token: string;
  /** Session record for storage */
  session: SessionRecord;
}

/**
 * Session manager configuration.
 */
export interface SessionManagerConfig {
  /** Session lifetime in milliseconds (default: 24 hours) */
  sessionLifetimeMs?: number;
  /** Inactivity timeout in milliseconds (default: 2 hours) */
  inactivityTimeoutMs?: number;
  /** Maximum concurrent sessions per user (default: 10) */
  maxSessionsPerUser?: number;
  /** Whether to extend session on activity (default: true) */
  extendOnActivity?: boolean;
  /** Token prefix */
  tokenPrefix?: string;
}

/**
 * Default session configuration values.
 */
const DEFAULTS: Required<SessionManagerConfig> = {
  sessionLifetimeMs: 24 * 60 * 60 * 1000,
  inactivityTimeoutMs: 2 * 60 * 60 * 1000,
  maxSessionsPerUser: 10,
  extendOnActivity: true,
  tokenPrefix: "sess_",
};

/**
 * Session manager for handling user sessions.
 */
export class SessionManager {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly config: Required<SessionManagerConfig>;

  /**
   * Create a new session manager.
   * @param config - Session configuration
   */
  constructor(config: SessionManagerConfig = {}) {
    this.config = {
      sessionLifetimeMs:
        config.sessionLifetimeMs ?? DEFAULTS.sessionLifetimeMs,
      inactivityTimeoutMs:
        config.inactivityTimeoutMs ?? DEFAULTS.inactivityTimeoutMs,
      maxSessionsPerUser:
        config.maxSessionsPerUser ?? DEFAULTS.maxSessionsPerUser,
      extendOnActivity:
        config.extendOnActivity ?? DEFAULTS.extendOnActivity,
      tokenPrefix: config.tokenPrefix ?? DEFAULTS.tokenPrefix,
    };
  }

  /**
   * Create a new session for a user.
   * If the user has reached the maximum number of concurrent sessions,
   * the oldest session is invalidated.
   * @param userId - User ID
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent string
   * @param deviceId - Optional device fingerprint
   * @param metadata - Optional session metadata
   * @returns Session token and record
   */
  createSession(
    userId: string,
    ipAddress: string,
    userAgent: string,
    deviceId?: string,
    metadata?: Record<string, unknown>
  ): CreateSessionResult {
    // Enforce max sessions per user
    this.enforceMaxSessions(userId);

    const token = `${this.config.tokenPrefix}${randomBytes(32).toString("hex")}`;
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = Date.now();

    const session: SessionRecord = {
      id: randomBytes(16).toString("hex"),
      userId,
      tokenHash,
      ipAddress,
      userAgent,
      deviceId: deviceId ?? null,
      createdAt: now,
      lastActivityAt: now,
      expiresAt: now + this.config.sessionLifetimeMs,
      active: true,
      metadata: metadata ?? {},
    };

    this.sessions.set(session.id, session);
    return { token, session };
  }

  /**
   * Validate a session token and update last activity.
   * @param token - Plain-text session token
   * @returns The session record if valid, null otherwise
   */
  validateSession(token: string): SessionRecord | null {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = Date.now();

    for (const session of this.sessions.values()) {
      if (!session.active) continue;

      // Constant-time comparison
      if (session.tokenHash.length !== tokenHash.length) continue;
      let mismatch = 0;
      for (let i = 0; i < tokenHash.length; i++) {
        mismatch |=
          session.tokenHash.charCodeAt(i) ^ tokenHash.charCodeAt(i);
      }
      if (mismatch !== 0) continue;

      // Check absolute expiration
      if (now > session.expiresAt) {
        session.active = false;
        return null;
      }

      // Check inactivity timeout
      if (
        now - session.lastActivityAt >
        this.config.inactivityTimeoutMs
      ) {
        session.active = false;
        return null;
      }

      // Update activity timestamp
      session.lastActivityAt = now;

      // Extend session if configured
      if (this.config.extendOnActivity) {
        const newExpiry = now + this.config.sessionLifetimeMs;
        session.expiresAt = Math.max(session.expiresAt, newExpiry);
      }

      return { ...session };
    }

    return null;
  }

  /**
   * Extend a session's expiration time.
   * @param sessionId - Session ID to extend
   * @param additionalMs - Additional time in milliseconds
   * @returns True if the session was extended
   */
  extendSession(sessionId: string, additionalMs?: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.active) {
      return false;
    }
    const extension = additionalMs ?? this.config.sessionLifetimeMs;
    session.expiresAt = Date.now() + extension;
    session.lastActivityAt = Date.now();
    return true;
  }

  /**
   * Invalidate (log out) a specific session.
   * @param sessionId - Session ID to invalidate
   * @returns True if the session was invalidated
   */
  invalidateSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return false;
    }
    session.active = false;
    return true;
  }

  /**
   * Invalidate all sessions for a user (log out everywhere).
   * @param userId - User ID
   * @returns Number of sessions invalidated
   */
  invalidateAllSessions(userId: string): number {
    let count = 0;
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.active) {
        session.active = false;
        count++;
      }
    }
    return count;
  }

  /**
   * List all active sessions for a user.
   * @param userId - User ID
   * @returns Array of active session records
   */
  listActiveSessions(userId: string): SessionRecord[] {
    const now = Date.now();
    const active: SessionRecord[] = [];

    for (const session of this.sessions.values()) {
      if (
        session.userId === userId &&
        session.active &&
        session.expiresAt > now
      ) {
        active.push({ ...session });
      }
    }

    return active.sort((a, b) => b.lastActivityAt - a.lastActivityAt);
  }

  /**
   * Get a session by its ID.
   * @param sessionId - Session ID
   * @returns Session record or null
   */
  getSession(sessionId: string): SessionRecord | null {
    const session = this.sessions.get(sessionId);
    return session ? { ...session } : null;
  }

  /**
   * Clean up expired and inactive sessions.
   * @returns Number of sessions removed
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, session] of this.sessions) {
      if (
        !session.active ||
        session.expiresAt <= now ||
        now - session.lastActivityAt > this.config.inactivityTimeoutMs
      ) {
        this.sessions.delete(id);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Enforce maximum sessions per user by removing the oldest.
   * @param userId - User ID
   */
  private enforceMaxSessions(userId: string): void {
    const userSessions = this.listActiveSessions(userId);
    if (userSessions.length >= this.config.maxSessionsPerUser) {
      const toRemove = userSessions.slice(this.config.maxSessionsPerUser - 1);
      for (const session of toRemove) {
        this.invalidateSession(session.id);
      }
    }
  }

  /**
   * Get total number of stored sessions.
   * @returns Session count
   */
  totalSessions(): number {
    return this.sessions.size;
  }
}
