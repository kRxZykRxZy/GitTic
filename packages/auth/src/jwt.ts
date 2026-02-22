import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "@platform/shared";

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

/**
 * Generate a JWT token for a user.
 */
export function generateToken(
  payload: Omit<JwtPayload, "iat" | "exp">,
  secret: string,
  expiresIn = "7d"
): string {
  const opts: SignOptions = { expiresIn: expiresIn as unknown as SignOptions["expiresIn"] };
  return jwt.sign(payload, secret, opts);
}

/**
 * Verify and decode a JWT token.
 */
export function verifyToken(token: string, secret: string): JwtPayload {
  return jwt.verify(token, secret) as JwtPayload;
}

/**
 * Decode token without verification (for inspection only).
 */
export function decodeToken(token: string): JwtPayload | null {
  const decoded = jwt.decode(token);
  return decoded as JwtPayload | null;
}
