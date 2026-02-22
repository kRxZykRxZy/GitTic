/**
 * Token-based authentication for cluster communication.
 * Handles cluster token validation, rotation, per-node tokens,
 * and token scope enforcement.
 * @module
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** Token scope defining allowed operations */
export type TokenScope =
  | "cluster:read"
  | "cluster:write"
  | "jobs:read"
  | "jobs:write"
  | "nodes:register"
  | "nodes:admin"
  | "metrics:read"
  | "admin";

/** Token metadata */
export interface ClusterToken {
  /** Token identifier (not the secret) */
  id: string;
  /** Token hash (stored instead of plaintext) */
  tokenHash: string;
  /** Associated node ID (null for cluster-wide tokens) */
  nodeId: string | null;
  /** Granted scopes */
  scopes: TokenScope[];
  /** When the token was created */
  createdAt: number;
  /** When the token expires (null = never) */
  expiresAt: number | null;
  /** When the token was last used */
  lastUsedAt: number | null;
  /** Whether the token is revoked */
  revoked: boolean;
  /** Description for auditing */
  description: string;
}

/** Token validation result */
export interface TokenValidationResult {
  /** Whether the token is valid */
  valid: boolean;
  /** Token metadata if valid */
  token: ClusterToken | null;
  /** Reason for rejection if invalid */
  reason: string | null;
}

/**
 * Manages cluster authentication tokens.
 * Generates, validates, rotates, and revokes tokens for secure
 * inter-node communication.
 */
export class TokenAuthManager {
  private readonly tokens = new Map<string, ClusterToken>();
  private readonly hmacSecret: string;
  private readonly tokenByteLength: number;

  /**
   * @param hmacSecret - Secret key for HMAC token hashing
   * @param tokenByteLength - Length of generated tokens in bytes (default: 32)
   */
  constructor(hmacSecret: string, tokenByteLength: number = 32) {
    this.hmacSecret = hmacSecret;
    this.tokenByteLength = tokenByteLength;
  }

  /**
   * Generate a new authentication token.
   * @param scopes - Allowed operations
   * @param nodeId - Optional node ID for per-node tokens
   * @param expiresInMs - Optional expiration time in ms from now
   * @param description - Token description
   * @returns Object containing the plaintext token and metadata
   */
  generateToken(
    scopes: TokenScope[],
    nodeId: string | null = null,
    expiresInMs: number | null = null,
    description: string = ""
  ): { plaintext: string; token: ClusterToken } {
    const rawToken = randomBytes(this.tokenByteLength).toString("hex");
    const tokenHash = this.hashToken(rawToken);
    const id = randomBytes(8).toString("hex");

    const token: ClusterToken = {
      id,
      tokenHash,
      nodeId,
      scopes,
      createdAt: Date.now(),
      expiresAt: expiresInMs ? Date.now() + expiresInMs : null,
      lastUsedAt: null,
      revoked: false,
      description,
    };

    this.tokens.set(id, token);

    return { plaintext: `${id}.${rawToken}`, token };
  }

  /**
   * Validate a token string and check it has the required scope.
   * @param tokenString - The plaintext token (format: "id.secret")
   * @param requiredScope - Optional scope that must be present
   * @returns Validation result
   */
  validate(
    tokenString: string,
    requiredScope?: TokenScope
  ): TokenValidationResult {
    const parts = tokenString.split(".");
    if (parts.length !== 2) {
      return { valid: false, token: null, reason: "Invalid token format" };
    }

    const [id, secret] = parts;
    const token = this.tokens.get(id);

    if (!token) {
      return { valid: false, token: null, reason: "Token not found" };
    }

    if (token.revoked) {
      return { valid: false, token: null, reason: "Token revoked" };
    }

    if (token.expiresAt && Date.now() > token.expiresAt) {
      return { valid: false, token: null, reason: "Token expired" };
    }

    const incomingHash = this.hashToken(secret);
    const storedHashBuffer = Buffer.from(token.tokenHash, "hex");
    const incomingHashBuffer = Buffer.from(incomingHash, "hex");

    if (
      storedHashBuffer.length !== incomingHashBuffer.length ||
      !timingSafeEqual(storedHashBuffer, incomingHashBuffer)
    ) {
      return { valid: false, token: null, reason: "Invalid token" };
    }

    if (requiredScope && !this.hasScope(token, requiredScope)) {
      return { valid: false, token, reason: `Missing scope: ${requiredScope}` };
    }

    token.lastUsedAt = Date.now();
    return { valid: true, token, reason: null };
  }

  /**
   * Revoke a token.
   * @param tokenId - Token identifier
   * @returns True if the token was found and revoked
   */
  revoke(tokenId: string): boolean {
    const token = this.tokens.get(tokenId);
    if (!token) return false;

    token.revoked = true;
    return true;
  }

  /**
   * Rotate a token: revoke the old one and generate a replacement.
   * @param tokenId - ID of the token to rotate
   * @returns New token info or null if original not found
   */
  rotate(tokenId: string): { plaintext: string; token: ClusterToken } | null {
    const oldToken = this.tokens.get(tokenId);
    if (!oldToken) return null;

    this.revoke(tokenId);

    const remainingMs = oldToken.expiresAt
      ? Math.max(0, oldToken.expiresAt - Date.now())
      : null;

    return this.generateToken(
      oldToken.scopes,
      oldToken.nodeId,
      remainingMs,
      `Rotated from ${tokenId}: ${oldToken.description}`
    );
  }

  /**
   * Check if a token has a specific scope.
   * The "admin" scope grants access to everything.
   */
  private hasScope(token: ClusterToken, scope: TokenScope): boolean {
    return token.scopes.includes("admin") || token.scopes.includes(scope);
  }

  /**
   * Hash a token using HMAC-SHA256.
   */
  private hashToken(token: string): string {
    return createHmac("sha256", this.hmacSecret).update(token).digest("hex");
  }

  /**
   * List all tokens (excluding secrets).
   * @param includeRevoked - Whether to include revoked tokens
   */
  listTokens(includeRevoked: boolean = false): ClusterToken[] {
    const all = Array.from(this.tokens.values());
    if (includeRevoked) return all;
    return all.filter((t) => !t.revoked);
  }

  /**
   * Get tokens for a specific node.
   * @param nodeId - Node identifier
   */
  getNodeTokens(nodeId: string): ClusterToken[] {
    return Array.from(this.tokens.values()).filter(
      (t) => t.nodeId === nodeId && !t.revoked
    );
  }

  /**
   * Remove expired and revoked tokens from storage.
   * @returns Number of tokens cleaned up
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;

    for (const [id, token] of this.tokens) {
      if (
        token.revoked ||
        (token.expiresAt && token.expiresAt < now)
      ) {
        this.tokens.delete(id);
        removed++;
      }
    }

    return removed;
  }
}
