import { createHmac, randomBytes } from "node:crypto";

/**
 * Generate a CSRF token.
 */
export function generateCsrfToken(secret: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = createHmac("sha256", secret).update(salt).digest("hex");
  return `${salt}.${hash}`;
}

/**
 * Validate a CSRF token.
 */
export function validateCsrfToken(token: string, secret: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const expected = createHmac("sha256", secret).update(salt).digest("hex");
  return hash === expected;
}
