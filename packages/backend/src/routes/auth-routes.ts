import { Router, type Request, type Response, type NextFunction } from "express";
import { hashPassword, comparePassword, generateToken, generateRefreshToken } from "@platform/auth";
import { isValidEmail, isValidUsername } from "@platform/utils";
import { requireAuth } from "../middleware/auth-guard.js";
import { validate } from "../middleware/input-validator.js";
import { getConfig } from "../config/app-config.js";
import * as userRepo from "../db/repositories/user-repo.js";
import * as sessionRepo from "../db/repositories/session-repo.js";

/**
 * Authentication routes.
 *
 * Handles user registration, login, logout, token refresh,
 * current-user retrieval, and password changes.
 */
const router = Router();

/** Session token lifetime (7 days). */
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Minimum age in years for COPPA compliance. */
const COPPA_MIN_AGE = 13;

/**
 * GET /api/v1/auth/check-username
 * 
 * Check if a username is available
 */
router.get("/check-username", async (req: Request, res: Response) => {
  try {
    const { username } = req.query;
    
    if (!username || typeof username !== "string") {
      res.status(400).json({
        success: false,
        error: "Username is required",
      });
      return;
    }

    const existingUser = userRepo.findByUsername(username);
    
    res.json({
      success: true,
      available: !existingUser,
      username,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check username availability",
    });
  }
});

/**
 * GET /api/v1/auth/check-email
 * 
 * Check if an email is available
 */
router.get("/check-email", async (req: Request, res: Response) => {
  try {
    const { email } = req.query;
    
    if (!email || typeof email !== "string") {
      res.status(400).json({
        success: false,
        error: "Email is required",
      });
      return;
    }

    const existingUser = userRepo.findByEmail(email);
    
    res.json({
      success: true,
      available: !existingUser,
      email,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to check email availability",
    });
  }
});

/**
 * POST /api/auth/register
 *
 * Creates a new user account. The very first user registered on
 * the platform is automatically promoted to admin. Requires COPPA
 * age verification, country, and acceptance of terms.
 */
router.post(
  "/register",
  validate([
    { field: "username", location: "body", required: true, type: "string", min: 3, max: 39, pattern: /^[a-zA-Z0-9_-]+$/ },
    { field: "email", location: "body", required: true, type: "string" },
    { field: "password", location: "body", required: true, type: "string", min: 8, max: 128 },
    { field: "country", location: "body", required: true, type: "string", min: 2, max: 2 },
    { field: "ageVerified", location: "body", required: true, type: "boolean" },
    { field: "termsAccepted", location: "body", required: true, type: "boolean" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { username, email, password, country, ageVerified, termsAccepted, displayName } = req.body;

      // Email format validation
      if (!isValidEmail(email)) {
        res.status(400).json({ error: "Invalid email format", code: "VALIDATION_ERROR" });
        return;
      }

      // Username format validation
      if (!isValidUsername(username)) {
        res.status(400).json({ error: "Invalid username format", code: "VALIDATION_ERROR" });
        return;
      }

      // COPPA age check
      if (!ageVerified) {
        res.status(403).json({
          error: `Users must be at least ${COPPA_MIN_AGE} years old`,
          code: "COPPA_AGE_REQUIREMENT",
        });
        return;
      }

      // Terms acceptance
      if (!termsAccepted) {
        res.status(400).json({
          error: "You must accept the terms of service",
          code: "TERMS_NOT_ACCEPTED",
        });
        return;
      }

      // Check for duplicate username or email
      if (userRepo.findByUsername(username)) {
        res.status(409).json({ error: "Username already taken", code: "CONFLICT" });
        return;
      }
      if (userRepo.findByEmail(email)) {
        res.status(409).json({ error: "Email already registered", code: "CONFLICT" });
        return;
      }

      // First user becomes admin
      const isFirst = userRepo.isFirstUser();
      const passwordHash = await hashPassword(password);

      const user = userRepo.createUser({
        username,
        email,
        passwordHash,
        role: isFirst ? "admin" : "user",
        displayName: displayName ?? undefined,
        country,
        ageVerified: true,
        termsAccepted: true,
      });

      // Generate JWT and session
      const config = getConfig();
      const token = generateToken({ userId: user.id, username: user.username, role: user.role }, config.jwt.secret);
      const refreshResult = generateRefreshToken(user.id);
      const refreshToken = refreshResult.plainToken;
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      sessionRepo.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress: req.ip ?? req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      });

      res.status(201).json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/login
 *
 * Authenticates an existing user with username/email + password.
 */
router.post(
  "/login",
  validate([
    { field: "login", location: "body", required: true, type: "string" },
    { field: "password", location: "body", required: true, type: "string" },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { login, password } = req.body;

      // Look up by username or email
      const user = userRepo.findByUsername(login) ?? userRepo.findByEmail(login);
      if (!user) {
        res.status(401).json({ error: "Invalid credentials", code: "AUTH_INVALID_CREDENTIALS" });
        return;
      }

      // Check suspension
      if (user.suspended) {
        res.status(403).json({
          error: "Account is suspended",
          code: "ACCOUNT_SUSPENDED",
          details: { suspendedUntil: user.suspendedUntil ?? null },
        });
        return;
      }

      // Verify password
      const valid = await comparePassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid credentials", code: "AUTH_INVALID_CREDENTIALS" });
        return;
      }

      // Issue tokens
      const config = getConfig();
      const token = generateToken({ userId: user.id, username: user.username, role: user.role }, config.jwt.secret);
      const refreshResult = generateRefreshToken(user.id);
      const refreshToken = refreshResult.plainToken;
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      sessionRepo.createSession({
        userId: user.id,
        token: refreshToken,
        expiresAt,
        ipAddress: req.ip ?? req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      });

      res.json({
        user: { id: user.id, username: user.username, email: user.email, role: user.role },
        token,
        refreshToken,
      });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * POST /api/auth/logout
 *
 * Invalidates the caller's refresh token, ending the session.
 */
router.post("/logout", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      const session = sessionRepo.findByToken(refreshToken);
      if (session && session.userId === req.user!.userId) {
        sessionRepo.deleteSession(session.id);
      }
    }
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 *
 * Rotates the refresh token and issues a new JWT access token.
 */
router.post(
  "/refresh",
  validate([
    { field: "refreshToken", location: "body", required: true, type: "string" },
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body;

      const session = sessionRepo.findByToken(refreshToken);
      if (!session) {
        res.status(401).json({ error: "Invalid refresh token", code: "AUTH_INVALID_REFRESH" });
        return;
      }

      const user = userRepo.findById(session.userId);
      if (!user) {
        sessionRepo.deleteSession(session.id);
        res.status(401).json({ error: "User not found", code: "AUTH_USER_NOT_FOUND" });
        return;
      }

      if (user.suspended) {
        res.status(403).json({ error: "Account is suspended", code: "ACCOUNT_SUSPENDED" });
        return;
      }

      // Delete old session and create a new one (token rotation)
      sessionRepo.deleteSession(session.id);
      const newRefreshResult = generateRefreshToken(user.id);
      const newRefreshToken = newRefreshResult.plainToken;
      const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

      sessionRepo.createSession({
        userId: user.id,
        token: newRefreshToken,
        expiresAt,
        ipAddress: req.ip ?? req.socket.remoteAddress,
        userAgent: req.get("user-agent"),
      });

      const token = generateToken({ userId: user.id, username: user.username, role: user.role }, getConfig().jwt.secret);

      res.json({ token, refreshToken: newRefreshToken });
    } catch (err) {
      next(err);
    }
  },
);

/**
 * GET /api/auth/me
 *
 * Returns the profile of the currently authenticated user.
 */
router.get("/me", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = userRepo.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
      return;
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/change-password
 *
 * Changes the password for the authenticated user. Requires the
 * current password for verification. Invalidates all existing sessions.
 */
router.post(
  "/change-password",
  requireAuth,
  validate([
    { field: "currentPassword", location: "body", required: true, type: "string" },
    { field: "newPassword", location: "body", required: true, type: "string", min: 8, max: 128 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = userRepo.findById(req.user!.userId);
      if (!user) {
        res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
        return;
      }

      const valid = await comparePassword(currentPassword, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Current password is incorrect", code: "AUTH_INVALID_CREDENTIALS" });
        return;
      }

      const newHash = await hashPassword(newPassword);
      // Update password by using a direct DB update since user-repo doesn't expose it
      const { getDb } = await import("../db/connection.js");
      getDb()
        .prepare("UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?")
        .run(newHash, new Date().toISOString(), user.id);

      // Invalidate all sessions for this user
      sessionRepo.deleteAllForUser(user.id);

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  },
);

export default router;
