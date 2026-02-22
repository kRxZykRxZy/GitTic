/**
 * Express-compatible authentication middleware.
 * Extracts JWT tokens from requests, verifies them, attaches user info,
 * and provides role-based access control middleware.
 * @module middleware/auth-middleware
 */

import jwt from "jsonwebtoken";
import type { UserRole } from "@platform/shared";
import { hasRole } from "../roles.js";
import type { Permission } from "../roles.js";
import { hasPermission } from "../roles.js";

/**
 * Authenticated user information attached to the request.
 */
export interface AuthUser {
  /** User ID from the JWT */
  userId: string;
  /** Username */
  username: string;
  /** User role */
  role: UserRole;
  /** JWT issued-at timestamp */
  iat?: number;
  /** JWT expiration timestamp */
  exp?: number;
}

/**
 * Simplified request-like interface for middleware compatibility.
 */
export interface AuthRequest {
  headers: Record<string, string | string[] | undefined>;
  cookies?: Record<string, string>;
  query?: Record<string, string>;
  /** Attached authenticated user (set by middleware) */
  user?: AuthUser;
}

/**
 * Simplified response-like interface for middleware compatibility.
 */
export interface AuthResponse {
  status(code: number): AuthResponse;
  json(body: unknown): void;
  set?(header: string, value: string): AuthResponse;
}

/**
 * Next function type for middleware chaining.
 */
export type NextFunction = (error?: Error) => void;

/**
 * Auth middleware configuration.
 */
export interface AuthMiddlewareConfig {
  /** JWT secret key for verification */
  secret: string;
  /** Whether authentication is optional (default: false) */
  optional?: boolean;
  /** Header name to extract token from (default: "authorization") */
  headerName?: string;
  /** Token prefix (default: "Bearer") */
  tokenPrefix?: string;
  /** Cookie name to extract token from (alternative to header) */
  cookieName?: string;
  /** Query parameter name to extract token from (alternative to header) */
  queryParamName?: string;
}

/**
 * Extract the JWT token from a request.
 * Checks Authorization header, cookies, and query parameters.
 * @param req - Request object
 * @param config - Middleware configuration
 * @returns Extracted token string or null
 */
export function extractToken(
  req: AuthRequest,
  config: AuthMiddlewareConfig
): string | null {
  const headerName = config.headerName ?? "authorization";
  const tokenPrefix = config.tokenPrefix ?? "Bearer";

  // Try Authorization header first
  const authHeader = req.headers[headerName];
  if (typeof authHeader === "string") {
    if (authHeader.startsWith(`${tokenPrefix} `)) {
      return authHeader.substring(tokenPrefix.length + 1);
    }
    return authHeader;
  }

  // Try cookies
  if (config.cookieName && req.cookies) {
    const cookieToken = req.cookies[config.cookieName];
    if (cookieToken) {
      return cookieToken;
    }
  }

  // Try query parameter
  if (config.queryParamName && req.query) {
    const queryToken = req.query[config.queryParamName];
    if (queryToken) {
      return queryToken;
    }
  }

  return null;
}

/**
 * Verify a JWT token and return the decoded user info.
 * @param token - JWT token string
 * @param secret - JWT secret key
 * @returns Decoded user or null if verification fails
 */
export function verifyAuthToken(
  token: string,
  secret: string
): AuthUser | null {
  try {
    const decoded = jwt.verify(token, secret) as Record<string, unknown>;
    if (
      typeof decoded.userId !== "string" ||
      typeof decoded.username !== "string" ||
      typeof decoded.role !== "string"
    ) {
      return null;
    }
    return {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role as UserRole,
      iat: decoded.iat as number | undefined,
      exp: decoded.exp as number | undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Create an authentication middleware.
 * Extracts the JWT token, verifies it, and attaches the user to the request.
 * @param config - Middleware configuration
 * @returns Middleware function
 */
export function createAuthMiddleware(
  config: AuthMiddlewareConfig
): (req: AuthRequest, res: AuthResponse, next: NextFunction) => void {
  return (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {
    const token = extractToken(req, config);

    if (!token) {
      if (config.optional) {
        next();
        return;
      }
      res.status(401).json({
        error: "Authentication required",
        message: "No authentication token provided",
      });
      return;
    }

    const user = verifyAuthToken(token, config.secret);
    if (!user) {
      if (config.optional) {
        next();
        return;
      }
      res.status(401).json({
        error: "Invalid token",
        message: "The provided authentication token is invalid or expired",
      });
      return;
    }

    req.user = user;
    next();
  };
}

/**
 * Create a role-checking middleware.
 * Requires the user to have at least the specified role level.
 * Must be used after authentication middleware.
 * @param requiredRole - Minimum role required
 * @returns Middleware function
 */
export function requireRole(
  requiredRole: UserRole
): (req: AuthRequest, res: AuthResponse, next: NextFunction) => void {
  return (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "You must be authenticated to access this resource",
      });
      return;
    }

    if (!hasRole(req.user.role, requiredRole)) {
      res.status(403).json({
        error: "Insufficient permissions",
        message: `Role "${requiredRole}" or higher is required`,
      });
      return;
    }

    next();
  };
}

/**
 * Create a permission-checking middleware.
 * Requires the user to have a specific permission.
 * Must be used after authentication middleware.
 * @param requiredPermission - Required permission
 * @returns Middleware function
 */
export function requirePermission(
  requiredPermission: Permission
): (req: AuthRequest, res: AuthResponse, next: NextFunction) => void {
  return (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "You must be authenticated to access this resource",
      });
      return;
    }

    if (!hasPermission(req.user.role, requiredPermission)) {
      res.status(403).json({
        error: "Insufficient permissions",
        message: `Permission "${requiredPermission}" is required`,
      });
      return;
    }

    next();
  };
}

/**
 * Create middleware that allows any of the specified roles.
 * @param allowedRoles - Array of allowed roles
 * @returns Middleware function
 */
export function requireAnyRole(
  allowedRoles: UserRole[]
): (req: AuthRequest, res: AuthResponse, next: NextFunction) => void {
  return (req: AuthRequest, res: AuthResponse, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: "Authentication required",
        message: "You must be authenticated to access this resource",
      });
      return;
    }

    const hasAllowedRole = allowedRoles.some((role) =>
      hasRole(req.user!.role, role)
    );

    if (!hasAllowedRole) {
      res.status(403).json({
        error: "Insufficient permissions",
        message: `One of the following roles is required: ${allowedRoles.join(", ")}`,
      });
      return;
    }

    next();
  };
}
