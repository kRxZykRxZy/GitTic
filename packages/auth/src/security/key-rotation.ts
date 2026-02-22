/**
 * JWT secret key rotation management.
 * Supports multiple active signing keys with graceful rotation,
 * allowing old keys to remain valid during a transition window.
 * @module security/key-rotation
 */

import { randomBytes, createHash } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";

/**
 * A signing key with metadata for rotation tracking.
 */
export interface SigningKey {
  /** Unique key ID (kid) */
  kid: string;
  /** The secret key material */
  secret: string;
  /** When this key was created */
  createdAt: number;
  /** When this key expires (null for no expiry) */
  expiresAt: number | null;
  /** Whether this is the current primary signing key */
  primary: boolean;
  /** Whether this key is still valid for verification */
  activeForVerification: boolean;
  /** Number of tokens signed with this key */
  tokensIssued: number;
}

/**
 * Key rotation configuration.
 */
export interface KeyRotationConfig {
  /** Length of generated keys in bytes (default: 64) */
  keyLength?: number;
  /** How long old keys remain valid for verification in ms (default: 7 days) */
  verificationWindowMs?: number;
  /** Maximum number of keys to retain (default: 5) */
  maxKeys?: number;
  /** Algorithm for JWT signing (default: HS256) */
  algorithm?: string;
}

/**
 * Default key rotation configuration.
 */
const DEFAULTS: Required<KeyRotationConfig> = {
  keyLength: 64,
  verificationWindowMs: 7 * 24 * 60 * 60 * 1000,
  maxKeys: 5,
  algorithm: "HS256",
};

/**
 * JWT key rotation manager.
 * Manages multiple signing keys to enable zero-downtime key rotation.
 */
export class KeyRotationManager {
  private readonly keys: SigningKey[] = [];
  private readonly config: Required<KeyRotationConfig>;

  /**
   * Create a new key rotation manager.
   * @param config - Rotation configuration
   */
  constructor(config: KeyRotationConfig = {}) {
    this.config = {
      keyLength: config.keyLength ?? DEFAULTS.keyLength,
      verificationWindowMs:
        config.verificationWindowMs ?? DEFAULTS.verificationWindowMs,
      maxKeys: config.maxKeys ?? DEFAULTS.maxKeys,
      algorithm: config.algorithm ?? DEFAULTS.algorithm,
    };
  }

  /**
   * Generate a unique key ID.
   * @returns Key ID string
   */
  private generateKid(): string {
    return `key_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
  }

  /**
   * Generate a new signing key and set it as the primary key.
   * Previous primary key remains valid for verification during the window.
   * @returns The new signing key
   */
  rotateKey(): SigningKey {
    const now = Date.now();

    // Demote current primary key
    for (const key of this.keys) {
      if (key.primary) {
        key.primary = false;
        key.expiresAt = now + this.config.verificationWindowMs;
      }
    }

    // Generate new primary key
    const newKey: SigningKey = {
      kid: this.generateKid(),
      secret: randomBytes(this.config.keyLength).toString("hex"),
      createdAt: now,
      expiresAt: null,
      primary: true,
      activeForVerification: true,
      tokensIssued: 0,
    };

    this.keys.push(newKey);
    this.cleanupKeys();

    return newKey;
  }

  /**
   * Add an existing key (e.g., loaded from storage at startup).
   * @param kid - Key ID
   * @param secret - Key secret
   * @param primary - Whether this is the primary key
   * @param createdAt - Creation timestamp
   */
  addKey(
    kid: string,
    secret: string,
    primary: boolean = false,
    createdAt?: number
  ): void {
    if (primary) {
      for (const key of this.keys) {
        key.primary = false;
      }
    }

    this.keys.push({
      kid,
      secret,
      createdAt: createdAt ?? Date.now(),
      expiresAt: null,
      primary,
      activeForVerification: true,
      tokensIssued: 0,
    });
  }

  /**
   * Get the current primary signing key.
   * If no key exists, automatically generates one.
   * @returns The primary signing key
   */
  getPrimaryKey(): SigningKey {
    const primary = this.keys.find((k) => k.primary);
    if (primary) {
      return primary;
    }
    return this.rotateKey();
  }

  /**
   * Get a key by its ID.
   * @param kid - Key ID to find
   * @returns The signing key or null
   */
  getKeyById(kid: string): SigningKey | null {
    return (
      this.keys.find(
        (k) => k.kid === kid && k.activeForVerification
      ) ?? null
    );
  }

  /**
   * Sign a JWT payload with the current primary key.
   * @param payload - JWT payload to sign
   * @param expiresIn - Token expiry (e.g., "7d", "1h")
   * @returns Signed JWT string
   */
  signToken(
    payload: Record<string, unknown>,
    expiresIn: string = "7d"
  ): string {
    const key = this.getPrimaryKey();
    key.tokensIssued++;

    const options: SignOptions = {
      algorithm: this.config.algorithm as jwt.Algorithm,
      expiresIn: expiresIn as unknown as SignOptions["expiresIn"],
      keyid: key.kid,
    };

    return jwt.sign(payload, key.secret, options);
  }

  /**
   * Verify a JWT token against all active keys.
   * Tries the key indicated by the kid header first, then falls back
   * to trying all active keys.
   * @param token - JWT token to verify
   * @returns Decoded payload or null if verification fails
   */
  verifyToken(token: string): Record<string, unknown> | null {
    // Try to extract kid from header
    const decoded = jwt.decode(token, { complete: true });
    if (decoded && typeof decoded === "object" && decoded.header?.kid) {
      const key = this.getKeyById(decoded.header.kid);
      if (key) {
        try {
          return jwt.verify(token, key.secret) as Record<
            string,
            unknown
          >;
        } catch {
          // Fall through to try other keys
        }
      }
    }

    // Try all active verification keys
    for (const key of this.getActiveVerificationKeys()) {
      try {
        return jwt.verify(token, key.secret) as Record<
          string,
          unknown
        >;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Get all keys that are currently valid for verification.
   * @returns Array of active verification keys
   */
  getActiveVerificationKeys(): SigningKey[] {
    const now = Date.now();
    return this.keys.filter((k) => {
      if (!k.activeForVerification) return false;
      if (k.expiresAt !== null && now > k.expiresAt) return false;
      return true;
    });
  }

  /**
   * Get all managed keys (for admin/debugging).
   * @returns Array of all keys (secrets redacted)
   */
  listKeys(): Array<Omit<SigningKey, "secret"> & { secretPreview: string }> {
    return this.keys.map((k) => ({
      kid: k.kid,
      createdAt: k.createdAt,
      expiresAt: k.expiresAt,
      primary: k.primary,
      activeForVerification: k.activeForVerification,
      tokensIssued: k.tokensIssued,
      secretPreview: k.secret.substring(0, 8) + "...",
    }));
  }

  /**
   * Revoke a specific key by ID.
   * @param kid - Key ID to revoke
   * @returns True if the key was found and revoked
   */
  revokeKey(kid: string): boolean {
    const key = this.keys.find((k) => k.kid === kid);
    if (!key) return false;

    key.activeForVerification = false;
    key.primary = false;

    // Ensure there's still a primary key
    if (!this.keys.some((k) => k.primary)) {
      const newest = this.keys
        .filter((k) => k.activeForVerification)
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      if (newest) {
        newest.primary = true;
      }
    }

    return true;
  }

  /**
   * Clean up expired and excess keys.
   */
  private cleanupKeys(): void {
    const now = Date.now();

    // Mark expired keys as inactive
    for (const key of this.keys) {
      if (key.expiresAt !== null && now > key.expiresAt) {
        key.activeForVerification = false;
      }
    }

    // Remove inactive keys beyond max
    while (this.keys.length > this.config.maxKeys) {
      const inactiveIndex = this.keys.findIndex(
        (k) => !k.activeForVerification
      );
      if (inactiveIndex >= 0) {
        this.keys.splice(inactiveIndex, 1);
      } else {
        break;
      }
    }
  }

  /**
   * Get the fingerprint (hash) of a key for identification.
   * @param kid - Key ID
   * @returns SHA-256 fingerprint or null
   */
  getKeyFingerprint(kid: string): string | null {
    const key = this.keys.find((k) => k.kid === kid);
    if (!key) return null;
    return createHash("sha256").update(key.secret).digest("hex");
  }
}
