/**
 * TOTP-based Two-Factor Authentication.
 * Implements Time-based One-Time Password (RFC 6238) using HMAC-SHA1.
 * Provides secret generation, code computation, and verification.
 * @module mfa/totp
 */

import { randomBytes, createHmac } from "node:crypto";

/**
 * Configuration for TOTP generation and verification.
 */
export interface TOTPConfig {
  /** Number of digits in the TOTP code (default: 6) */
  digits?: number;
  /** Time step in seconds (default: 30) */
  period?: number;
  /** Hash algorithm (default: sha1) */
  algorithm?: "sha1" | "sha256" | "sha512";
  /** Number of periods to check before/after current for clock drift (default: 1) */
  window?: number;
}

/**
 * TOTP secret with associated metadata.
 */
export interface TOTPSecret {
  /** Raw secret bytes as a Buffer */
  raw: Buffer;
  /** Base32-encoded secret for sharing with authenticator apps */
  base32: string;
  /** Hex-encoded secret for storage */
  hex: string;
}

/**
 * Result of TOTP verification.
 */
export interface TOTPVerificationResult {
  /** Whether the code is valid */
  valid: boolean;
  /** The time step offset where the code matched (-window to +window) */
  delta: number | null;
}

/**
 * Base32 alphabet used for encoding secrets.
 */
const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

/**
 * Encode a Buffer to Base32 string.
 * @param buffer - Bytes to encode
 * @returns Base32-encoded string
 */
export function encodeBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let result = "";

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      result += BASE32_ALPHABET[(value >>> bits) & 0x1f];
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 0x1f];
  }

  return result;
}

/**
 * Decode a Base32 string to a Buffer.
 * @param encoded - Base32-encoded string
 * @returns Decoded bytes
 */
export function decodeBase32(encoded: string): Buffer {
  const cleaned = encoded.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) {
      throw new Error(`Invalid base32 character: ${char}`);
    }
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >>> bits) & 0xff);
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generate a new random TOTP secret.
 * @param length - Number of random bytes for the secret (default: 20)
 * @returns TOTP secret with raw, base32, and hex representations
 */
export function generateTOTPSecret(length: number = 20): TOTPSecret {
  const raw = randomBytes(length);
  return {
    raw,
    base32: encodeBase32(raw),
    hex: raw.toString("hex"),
  };
}

/**
 * Compute the HOTP value for a given counter.
 * @param secret - Secret key as a Buffer
 * @param counter - 64-bit counter value
 * @param digits - Number of digits in the code
 * @param algorithm - HMAC hash algorithm
 * @returns The OTP code as a zero-padded string
 */
export function computeHOTP(
  secret: Buffer,
  counter: number,
  digits: number = 6,
  algorithm: string = "sha1"
): string {
  // Convert counter to 8-byte big-endian buffer
  const counterBuffer = Buffer.alloc(8);
  let remaining = counter;
  for (let i = 7; i >= 0; i--) {
    counterBuffer[i] = remaining & 0xff;
    remaining = Math.floor(remaining / 256);
  }

  // HMAC
  const hmac = createHmac(algorithm, secret).update(counterBuffer).digest();

  // Dynamic truncation
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = code % Math.pow(10, digits);
  return otp.toString().padStart(digits, "0");
}

/**
 * Compute the current TOTP code for a given secret.
 * @param secret - Secret key as a Buffer or base32 string
 * @param config - TOTP configuration options
 * @param timestamp - Optional timestamp in milliseconds (defaults to Date.now())
 * @returns The current TOTP code
 */
export function computeTOTP(
  secret: Buffer | string,
  config: TOTPConfig = {},
  timestamp?: number
): string {
  const secretBuffer =
    typeof secret === "string" ? decodeBase32(secret) : secret;
  const period = config.period ?? 30;
  const digits = config.digits ?? 6;
  const algorithm = config.algorithm ?? "sha1";
  const time = timestamp ?? Date.now();

  const counter = Math.floor(time / 1000 / period);
  return computeHOTP(secretBuffer, counter, digits, algorithm);
}

/**
 * Verify a TOTP code against a secret.
 * Checks the code against the current time step and a configurable window
 * of adjacent time steps to account for clock drift.
 * @param code - The TOTP code to verify
 * @param secret - Secret key as a Buffer or base32 string
 * @param config - TOTP configuration options
 * @param timestamp - Optional timestamp in milliseconds
 * @returns Verification result with validity and time step delta
 */
export function verifyTOTP(
  code: string,
  secret: Buffer | string,
  config: TOTPConfig = {},
  timestamp?: number
): TOTPVerificationResult {
  const secretBuffer =
    typeof secret === "string" ? decodeBase32(secret) : secret;
  const period = config.period ?? 30;
  const digits = config.digits ?? 6;
  const algorithm = config.algorithm ?? "sha1";
  const window = config.window ?? 1;
  const time = timestamp ?? Date.now();
  const currentCounter = Math.floor(time / 1000 / period);

  for (let delta = -window; delta <= window; delta++) {
    const counter = currentCounter + delta;
    const expected = computeHOTP(secretBuffer, counter, digits, algorithm);

    // Constant-time comparison
    if (expected.length === code.length) {
      let mismatch = 0;
      for (let i = 0; i < expected.length; i++) {
        mismatch |= expected.charCodeAt(i) ^ code.charCodeAt(i);
      }
      if (mismatch === 0) {
        return { valid: true, delta };
      }
    }
  }

  return { valid: false, delta: null };
}

/**
 * Generate an otpauth:// URI for use with authenticator apps.
 * This URI can be encoded as a QR code for easy scanning.
 * @param issuer - Name of the service/application
 * @param accountName - User's account identifier (usually email)
 * @param secret - Base32-encoded secret
 * @param config - TOTP configuration options
 * @returns otpauth:// URI string
 */
export function generateOTPAuthURI(
  issuer: string,
  accountName: string,
  secret: string,
  config: TOTPConfig = {}
): string {
  const digits = config.digits ?? 6;
  const period = config.period ?? 30;
  const algorithm = (config.algorithm ?? "sha1").toUpperCase();

  const label = encodeURIComponent(`${issuer}:${accountName}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm,
    digits: digits.toString(),
    period: period.toString(),
  });

  return `otpauth://totp/${label}?${params.toString()}`;
}
