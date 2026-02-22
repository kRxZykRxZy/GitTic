/**
 * OAuth state parameter management for CSRF protection.
 * Generates and validates cryptographically-safe state tokens
 * used during the OAuth authorization flow.
 * @module oauth/oauth-state
 */

import { randomBytes, createHmac } from "node:crypto";
import type { OAuthState, OAuthProviderName } from "./oauth-types.js";

/**
 * Default state token TTL in milliseconds (10 minutes).
 */
const DEFAULT_STATE_TTL_MS = 10 * 60 * 1000;

/**
 * In-memory store for pending OAuth state tokens.
 * Maps state string -> OAuthState object.
 */
const pendingStates = new Map<string, OAuthState>();

/**
 * Configuration for the OAuth state manager.
 */
export interface OAuthStateConfig {
  /** Secret used to sign state tokens via HMAC */
  signingSecret: string;
  /** How long a state token remains valid in milliseconds */
  ttlMs?: number;
  /** Maximum number of pending states to store (prevents memory exhaustion) */
  maxPendingStates?: number;
}

/**
 * Generate a cryptographically secure nonce string.
 * @param length - Number of random bytes (output is hex, so string length = 2 * bytes)
 * @returns Hex-encoded random string
 */
export function generateNonce(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Sign a nonce with HMAC-SHA256 to produce a tamper-proof state string.
 * @param nonce - The random nonce to sign
 * @param secret - The HMAC signing secret
 * @returns The signed state string in format "nonce.signature"
 */
export function signState(nonce: string, secret: string): string {
  const signature = createHmac("sha256", secret).update(nonce).digest("hex");
  return `${nonce}.${signature}`;
}

/**
 * Verify that a signed state string has not been tampered with.
 * @param stateString - The "nonce.signature" state string
 * @param secret - The HMAC signing secret
 * @returns True if the signature is valid
 */
export function verifyStateSignature(
  stateString: string,
  secret: string
): boolean {
  const dotIndex = stateString.indexOf(".");
  if (dotIndex === -1) {
    return false;
  }
  const nonce = stateString.substring(0, dotIndex);
  const providedSignature = stateString.substring(dotIndex + 1);
  const expectedSignature = createHmac("sha256", secret)
    .update(nonce)
    .digest("hex");

  // Constant-time comparison to prevent timing attacks
  if (providedSignature.length !== expectedSignature.length) {
    return false;
  }
  let mismatch = 0;
  for (let i = 0; i < providedSignature.length; i++) {
    mismatch |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
  }
  return mismatch === 0;
}

/**
 * Create and store a new OAuth state token.
 * @param config - State manager configuration
 * @param provider - The OAuth provider name
 * @param returnTo - Optional URL to redirect to after auth
 * @param metadata - Optional additional metadata
 * @returns The signed state string to include in the authorization URL
 */
export function createOAuthState(
  config: OAuthStateConfig,
  provider: OAuthProviderName,
  returnTo?: string,
  metadata?: Record<string, string>
): string {
  const maxStates = config.maxPendingStates ?? 1000;
  if (pendingStates.size >= maxStates) {
    cleanupExpiredStates(config.ttlMs ?? DEFAULT_STATE_TTL_MS);
  }

  const nonce = generateNonce();
  const stateString = signState(nonce, config.signingSecret);

  const stateObj: OAuthState = {
    nonce,
    provider,
    returnTo,
    createdAt: Date.now(),
    metadata,
  };

  pendingStates.set(stateString, stateObj);
  return stateString;
}

/**
 * Validate and consume an OAuth state token from a callback.
 * The state is removed from the store after validation (single-use).
 * @param config - State manager configuration
 * @param stateString - The state string from the callback
 * @returns The validated OAuthState or null if invalid/expired
 */
export function validateOAuthState(
  config: OAuthStateConfig,
  stateString: string
): OAuthState | null {
  if (!verifyStateSignature(stateString, config.signingSecret)) {
    return null;
  }

  const stateObj = pendingStates.get(stateString);
  if (!stateObj) {
    return null;
  }

  // Remove state (single-use)
  pendingStates.delete(stateString);

  // Check expiration
  const ttl = config.ttlMs ?? DEFAULT_STATE_TTL_MS;
  if (Date.now() - stateObj.createdAt > ttl) {
    return null;
  }

  return stateObj;
}

/**
 * Remove all expired state tokens from the store.
 * @param ttlMs - Time-to-live in milliseconds
 * @returns Number of states removed
 */
export function cleanupExpiredStates(ttlMs: number = DEFAULT_STATE_TTL_MS): number {
  const now = Date.now();
  let removed = 0;
  for (const [key, state] of pendingStates) {
    if (now - state.createdAt > ttlMs) {
      pendingStates.delete(key);
      removed++;
    }
  }
  return removed;
}

/**
 * Get the number of currently pending state tokens.
 * @returns Count of pending states
 */
export function getPendingStateCount(): number {
  return pendingStates.size;
}

/**
 * Clear all pending state tokens (useful for testing).
 */
export function clearAllStates(): void {
  pendingStates.clear();
}
