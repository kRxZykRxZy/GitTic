import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@platform/shared";
import { verifyToken } from "@platform/auth";
import { getConfig } from "../config/app-config.js";

/**
 * Augment the Express Request interface to include the authenticated
 * user payload. This is populated by the `requireAuth` middleware.
 */
declare global {
    namespace Express {
        interface AuthenticatedUser {
            id: string;
            userId: string;
            username: string;
            role: UserRole;
            tier?: string;
        }

        interface Request {
            user?: AuthenticatedUser;
        }
    }
}

/**
 * Extract a Bearer token from the Authorization header.
 * Returns `null` when the header is missing or malformed.
 */
function extractBearerToken(req: Request): string | null {
    const header = req.headers.authorization;
    if (!header) return null;
    const parts = header.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") return null;
    return parts[1];
}

/**
 * Middleware that requires a valid JWT in the Authorization header.
 *
 * On success the decoded payload is attached to `req.user`.
 * On failure a 401 JSON error is returned and the request chain is
 * terminated.
 *
 * @example
 * router.get("/me", requireAuth, (req, res) => {
 *   res.json(req.user);
 * });
 */
export function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const token = extractBearerToken(req);
    if (!token) {
        res.status(401).json({
            error: "Authentication required",
            code: "AUTH_REQUIRED",
        });
        return;
    }

    try {
        const payload = verifyToken(token, getConfig().jwt.secret);
        req.user = {
            id: payload.userId,
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            tier: "free",
        };
        next();
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Invalid or expired token";
        res.status(401).json({
            error: message,
            code: "AUTH_INVALID_TOKEN",
        });
    }
}

/**
 * Middleware factory that enforces a minimum role level.
 *
 * The role hierarchy is: `user` < `moderator` < `admin`.
 * A user with a higher role is always allowed access to routes
 * that require a lower role.
 *
 * Must be used **after** `requireAuth` so that `req.user` is populated.
 *
 * @param role - The minimum role required to access the route.
 * @returns Express middleware function.
 *
 * @example
 * router.delete("/users/:id", requireAuth, requireRole("admin"), handler);
 */
export function requireRole(
    role: UserRole,
): (req: Request, res: Response, next: NextFunction) => void {
    const hierarchy: Record<string, number> = {
        user: 0,
        moderator: 1,
        admin: 2,
    };

    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                error: "Authentication required",
                code: "AUTH_REQUIRED",
            });
            return;
        }

        const userLevel = hierarchy[req.user.role] ?? 0;
        const requiredLevel = hierarchy[role] ?? 0;

        if (userLevel < requiredLevel) {
            res.status(403).json({
                error: `Insufficient permissions. Required role: ${role}`,
                code: "FORBIDDEN_ROLE",
            });
            return;
        }

        next();
    };
}

/**
 * Middleware that optionally authenticates the user.
 *
 * If a valid Bearer token is present the decoded payload is attached
 * to `req.user`. If the token is absent or invalid the request
 * proceeds without error – `req.user` will simply be `undefined`.
 *
 * Useful for endpoints that behave differently for authenticated
 * vs anonymous visitors (e.g. showing private projects).
 *
 * @example
 * router.get("/projects", optionalAuth, listProjects);
 */
export function optionalAuth(
    req: Request,
    res: Response,
    next: NextFunction,
): void {
    const token = extractBearerToken(req);
    if (!token) {
        next();
        return;
    }

    try {
        const payload = verifyToken(token, getConfig().jwt.secret);
        req.user = {
            id: payload.userId,
            userId: payload.userId,
            username: payload.username,
            role: payload.role,
            tier: "free",
        };
    } catch {
        // Token is present but invalid – treat as unauthenticated
    }

    next();
}
