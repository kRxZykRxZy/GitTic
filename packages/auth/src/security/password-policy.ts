/**
 * Password policy enforcement.
 * Implements configurable password complexity rules, breach detection
 * placeholder, password history tracking, and forced rotation.
 * @module security/password-policy
 */

import { createHash } from "node:crypto";

/**
 * Password complexity requirements.
 */
export interface PasswordComplexityRules {
  /** Minimum password length */
  minLength: number;
  /** Maximum password length */
  maxLength: number;
  /** Require at least one uppercase letter */
  requireUppercase: boolean;
  /** Require at least one lowercase letter */
  requireLowercase: boolean;
  /** Require at least one digit */
  requireDigit: boolean;
  /** Require at least one special character */
  requireSpecialChar: boolean;
  /** Minimum number of unique characters */
  minUniqueChars: number;
  /** Disallow common passwords */
  disallowCommon: boolean;
  /** Disallow passwords containing the username */
  disallowUsername: boolean;
  /** Special characters that satisfy the requirement */
  specialCharSet: string;
}

/**
 * Password validation result.
 */
export interface PasswordValidationResult {
  /** Whether the password meets all requirements */
  valid: boolean;
  /** List of validation errors */
  errors: string[];
  /** Password strength score (0-100) */
  strengthScore: number;
  /** Strength label */
  strengthLabel: "very_weak" | "weak" | "fair" | "strong" | "very_strong";
}

/**
 * Password history entry.
 */
export interface PasswordHistoryEntry {
  /** SHA-256 hash of the password */
  passwordHash: string;
  /** When this password was set */
  changedAt: number;
}

/**
 * Password policy configuration.
 */
export interface PasswordPolicyConfig {
  /** Complexity rules */
  complexity?: Partial<PasswordComplexityRules>;
  /** Number of previous passwords to remember (default: 5) */
  historySize?: number;
  /** Maximum password age in days (null for no expiry) */
  maxAgeDays?: number | null;
  /** Minimum password age in hours before allowing change */
  minAgeHours?: number;
  /** Whether to check against known breached passwords (placeholder) */
  checkBreaches?: boolean;
}

/**
 * Common passwords that should be disallowed.
 */
const COMMON_PASSWORDS = new Set([
  "password", "123456", "12345678", "qwerty", "abc123",
  "monkey", "master", "dragon", "111111", "baseball",
  "iloveyou", "trustno1", "sunshine", "princess", "football",
  "shadow", "superman", "letmein", "welcome", "admin",
  "password1", "password123", "pass1234", "changeme",
]);

/**
 * Default complexity rules.
 */
const DEFAULT_COMPLEXITY: PasswordComplexityRules = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSpecialChar: true,
  minUniqueChars: 5,
  disallowCommon: true,
  disallowUsername: true,
  specialCharSet: "!@#$%^&*()_+-=[]{}|;':\",./<>?`~",
};

/**
 * Password policy manager.
 */
export class PasswordPolicy {
  private readonly complexity: PasswordComplexityRules;
  private readonly historySize: number;
  private readonly maxAgeDays: number | null;
  private readonly minAgeHours: number;
  private readonly checkBreaches: boolean;
  private readonly history = new Map<string, PasswordHistoryEntry[]>();

  /**
   * Create a new password policy.
   * @param config - Policy configuration
   */
  constructor(config: PasswordPolicyConfig = {}) {
    this.complexity = {
      ...DEFAULT_COMPLEXITY,
      ...config.complexity,
    };
    this.historySize = config.historySize ?? 5;
    this.maxAgeDays = config.maxAgeDays ?? null;
    this.minAgeHours = config.minAgeHours ?? 0;
    this.checkBreaches = config.checkBreaches ?? false;
  }

  /**
   * Validate a password against the policy.
   * @param password - Password to validate
   * @param username - Optional username to check against
   * @returns Validation result with errors and strength score
   */
  validate(password: string, username?: string): PasswordValidationResult {
    const errors: string[] = [];

    // Length checks
    if (password.length < this.complexity.minLength) {
      errors.push(
        `Password must be at least ${this.complexity.minLength} characters`
      );
    }
    if (password.length > this.complexity.maxLength) {
      errors.push(
        `Password must not exceed ${this.complexity.maxLength} characters`
      );
    }

    // Character class checks
    if (this.complexity.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (this.complexity.requireLowercase && !/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (this.complexity.requireDigit && !/\d/.test(password)) {
      errors.push("Password must contain at least one digit");
    }
    if (this.complexity.requireSpecialChar) {
      const hasSpecial = [...password].some((c) =>
        this.complexity.specialCharSet.includes(c)
      );
      if (!hasSpecial) {
        errors.push(
          "Password must contain at least one special character"
        );
      }
    }

    // Unique characters
    const uniqueChars = new Set(password).size;
    if (uniqueChars < this.complexity.minUniqueChars) {
      errors.push(
        `Password must contain at least ${this.complexity.minUniqueChars} unique characters`
      );
    }

    // Common password check
    if (
      this.complexity.disallowCommon &&
      COMMON_PASSWORDS.has(password.toLowerCase())
    ) {
      errors.push("This password is too common");
    }

    // Username check
    if (
      this.complexity.disallowUsername &&
      username &&
      password.toLowerCase().includes(username.toLowerCase())
    ) {
      errors.push("Password must not contain your username");
    }

    // Calculate strength
    const strengthScore = this.calculateStrength(password);
    const strengthLabel = this.getStrengthLabel(strengthScore);

    return {
      valid: errors.length === 0,
      errors,
      strengthScore,
      strengthLabel,
    };
  }

  /**
   * Calculate a password strength score (0-100).
   * @param password - Password to score
   * @returns Strength score
   */
  calculateStrength(password: string): number {
    let score = 0;

    // Length contribution (up to 30 points)
    score += Math.min(30, password.length * 2);

    // Character variety (up to 40 points)
    if (/[a-z]/.test(password)) score += 8;
    if (/[A-Z]/.test(password)) score += 8;
    if (/\d/.test(password)) score += 8;
    if (/[^a-zA-Z0-9]/.test(password)) score += 8;
    const uniqueRatio = new Set(password).size / password.length;
    score += Math.round(uniqueRatio * 8);

    // Entropy estimation (up to 30 points)
    let charsetSize = 0;
    if (/[a-z]/.test(password)) charsetSize += 26;
    if (/[A-Z]/.test(password)) charsetSize += 26;
    if (/\d/.test(password)) charsetSize += 10;
    if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
    const entropy =
      password.length * Math.log2(Math.max(1, charsetSize));
    score += Math.min(30, Math.round(entropy / 4));

    // Penalize common patterns
    if (/^[a-z]+$/.test(password)) score -= 10;
    if (/^[0-9]+$/.test(password)) score -= 20;
    if (COMMON_PASSWORDS.has(password.toLowerCase())) score -= 50;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get a strength label from a score.
   * @param score - Strength score (0-100)
   * @returns Strength label
   */
  getStrengthLabel(
    score: number
  ): PasswordValidationResult["strengthLabel"] {
    if (score < 20) return "very_weak";
    if (score < 40) return "weak";
    if (score < 60) return "fair";
    if (score < 80) return "strong";
    return "very_strong";
  }

  /**
   * Check if a password was recently used (password history).
   * @param userId - User ID
   * @param password - Password to check
   * @returns True if the password was recently used
   */
  isInHistory(userId: string, password: string): boolean {
    const userHistory = this.history.get(userId) ?? [];
    const passwordHash = createHash("sha256")
      .update(password)
      .digest("hex");

    return userHistory.some((entry) => entry.passwordHash === passwordHash);
  }

  /**
   * Add a password to the user's history.
   * @param userId - User ID
   * @param password - Password to add to history
   */
  addToHistory(userId: string, password: string): void {
    const passwordHash = createHash("sha256")
      .update(password)
      .digest("hex");

    let userHistory = this.history.get(userId);
    if (!userHistory) {
      userHistory = [];
      this.history.set(userId, userHistory);
    }

    userHistory.push({
      passwordHash,
      changedAt: Date.now(),
    });

    // Trim history
    while (userHistory.length > this.historySize) {
      userHistory.shift();
    }
  }

  /**
   * Check if a user's password needs rotation.
   * @param userId - User ID
   * @returns True if the password has exceeded max age
   */
  needsRotation(userId: string): boolean {
    if (this.maxAgeDays === null) {
      return false;
    }

    const userHistory = this.history.get(userId) ?? [];
    if (userHistory.length === 0) {
      return true;
    }

    const lastChange = userHistory[userHistory.length - 1];
    const ageMs = Date.now() - lastChange.changedAt;
    const maxAgeMs = this.maxAgeDays * 24 * 60 * 60 * 1000;

    return ageMs > maxAgeMs;
  }

  /**
   * Check if a user can change their password (minimum age restriction).
   * @param userId - User ID
   * @returns True if the user can change their password
   */
  canChangePassword(userId: string): boolean {
    if (this.minAgeHours === 0) {
      return true;
    }

    const userHistory = this.history.get(userId) ?? [];
    if (userHistory.length === 0) {
      return true;
    }

    const lastChange = userHistory[userHistory.length - 1];
    const ageMs = Date.now() - lastChange.changedAt;
    const minAgeMs = this.minAgeHours * 60 * 60 * 1000;

    return ageMs >= minAgeMs;
  }

  /**
   * Placeholder: check if a password appears in known data breaches.
   * In production, this would call the Have I Been Pwned API or similar.
   * @param _password - Password to check
   * @returns Always returns false (placeholder)
   */
  async checkBreachDatabase(_password: string): Promise<boolean> {
    if (!this.checkBreaches) {
      return false;
    }
    // Placeholder: would call HaveIBeenPwned k-anonymity API
    return false;
  }

  /**
   * Get the current complexity rules.
   * @returns Current complexity rules
   */
  getComplexityRules(): Readonly<PasswordComplexityRules> {
    return { ...this.complexity };
  }
}
