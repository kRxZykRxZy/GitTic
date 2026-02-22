/**
 * Signed inter-node communication using HMAC.
 * Signs and verifies messages between cluster nodes
 * with nonce-based replay prevention.
 * @module
 */

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** A signed message envelope */
export interface SignedMessage {
  /** Message payload (JSON string) */
  payload: string;
  /** HMAC signature */
  signature: string;
  /** Unique nonce for replay prevention */
  nonce: string;
  /** Timestamp when the message was signed */
  timestamp: number;
  /** Sender node identifier */
  senderId: string;
}

/** Verification result */
export interface VerificationResult {
  /** Whether the message is valid */
  valid: boolean;
  /** Parsed payload if valid */
  payload: unknown;
  /** Reason for rejection if invalid */
  reason: string | null;
}

/** Configuration for signed communication */
export interface SignedCommConfig {
  /** Shared secret for HMAC signing */
  sharedSecret: string;
  /** Maximum message age in ms before rejection (default: 5 minutes) */
  maxMessageAgeMs: number;
  /** Maximum nonces to track for replay prevention */
  maxNonceHistory: number;
  /** Hash algorithm (default: sha256) */
  algorithm: string;
}

/** Default configuration */
const DEFAULT_CONFIG: Omit<SignedCommConfig, "sharedSecret"> = {
  maxMessageAgeMs: 300_000,
  maxNonceHistory: 10_000,
  algorithm: "sha256",
};

/**
 * Provides HMAC-based message signing and verification
 * for secure inter-node communication with replay prevention.
 */
export class SignedCommunication {
  private readonly config: SignedCommConfig;
  private readonly usedNonces = new Set<string>();
  private readonly nonceTimestamps = new Map<string, number>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * @param sharedSecret - Shared secret for signing
   * @param config - Additional configuration options
   */
  constructor(sharedSecret: string, config: Partial<Omit<SignedCommConfig, "sharedSecret">> = {}) {
    this.config = {
      sharedSecret,
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  /**
   * Sign a message payload for secure transmission.
   * @param payload - Data to sign (will be JSON serialized)
   * @param senderId - Identifier of the sending node
   * @returns Signed message envelope
   */
  sign(payload: unknown, senderId: string): SignedMessage {
    const payloadStr = JSON.stringify(payload);
    const nonce = randomBytes(16).toString("hex");
    const timestamp = Date.now();

    const dataToSign = this.buildSignatureData(payloadStr, nonce, timestamp, senderId);
    const signature = this.computeHmac(dataToSign);

    return {
      payload: payloadStr,
      signature,
      nonce,
      timestamp,
      senderId,
    };
  }

  /**
   * Verify a signed message.
   * Checks signature validity, message freshness, and replay prevention.
   * @param message - Signed message to verify
   * @returns Verification result
   */
  verify(message: SignedMessage): VerificationResult {
    // Check message age
    const age = Date.now() - message.timestamp;
    if (age > this.config.maxMessageAgeMs) {
      return {
        valid: false,
        payload: null,
        reason: `Message too old: ${age}ms (max: ${this.config.maxMessageAgeMs}ms)`,
      };
    }

    if (age < -30_000) {
      return {
        valid: false,
        payload: null,
        reason: "Message timestamp is in the future",
      };
    }

    // Check replay
    if (this.usedNonces.has(message.nonce)) {
      return {
        valid: false,
        payload: null,
        reason: "Replay detected: nonce already used",
      };
    }

    // Verify signature
    const dataToSign = this.buildSignatureData(
      message.payload,
      message.nonce,
      message.timestamp,
      message.senderId
    );
    const expectedSignature = this.computeHmac(dataToSign);

    const sigBuffer = Buffer.from(message.signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (
      sigBuffer.length !== expectedBuffer.length ||
      !timingSafeEqual(sigBuffer, expectedBuffer)
    ) {
      return {
        valid: false,
        payload: null,
        reason: "Invalid signature",
      };
    }

    // Record nonce to prevent replay
    this.recordNonce(message.nonce);

    // Parse payload
    try {
      const parsed = JSON.parse(message.payload) as unknown;
      return {
        valid: true,
        payload: parsed,
        reason: null,
      };
    } catch {
      return {
        valid: false,
        payload: null,
        reason: "Failed to parse payload",
      };
    }
  }

  /**
   * Build the data string for HMAC computation.
   * Includes payload, nonce, timestamp, and sender ID for integrity.
   */
  private buildSignatureData(
    payload: string,
    nonce: string,
    timestamp: number,
    senderId: string
  ): string {
    return `${payload}|${nonce}|${timestamp}|${senderId}`;
  }

  /**
   * Compute HMAC for the given data.
   */
  private computeHmac(data: string): string {
    return createHmac(this.config.algorithm, this.config.sharedSecret)
      .update(data)
      .digest("hex");
  }

  /**
   * Record a nonce and its timestamp for replay prevention.
   */
  private recordNonce(nonce: string): void {
    this.usedNonces.add(nonce);
    this.nonceTimestamps.set(nonce, Date.now());

    if (this.usedNonces.size > this.config.maxNonceHistory) {
      this.pruneNonces();
    }
  }

  /**
   * Remove old nonces that are past the message age window.
   */
  private pruneNonces(): void {
    const cutoff = Date.now() - this.config.maxMessageAgeMs;

    for (const [nonce, timestamp] of this.nonceTimestamps) {
      if (timestamp < cutoff) {
        this.usedNonces.delete(nonce);
        this.nonceTimestamps.delete(nonce);
      }
    }
  }

  /**
   * Start periodic nonce cleanup.
   * @param intervalMs - Cleanup interval (default: 60s)
   */
  startCleanup(intervalMs: number = 60_000): void {
    if (this.cleanupTimer) return;

    this.cleanupTimer = setInterval(() => {
      this.pruneNonces();
    }, intervalMs);
  }

  /**
   * Stop periodic nonce cleanup.
   */
  stopCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get the number of tracked nonces.
   */
  getNonceCount(): number {
    return this.usedNonces.size;
  }

  /**
   * Create a convenience function for signing messages from a specific node.
   * @param senderId - Node identifier
   * @returns A function that signs payloads
   */
  createSigner(senderId: string): (payload: unknown) => SignedMessage {
    return (payload: unknown) => this.sign(payload, senderId);
  }
}
