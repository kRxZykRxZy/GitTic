/**
 * User schema types for validation and API contracts.
 * @module schemas/user-schema
 */

/**
 * Schema for creating a new user account.
 */
export interface CreateUserSchema {
  /** Username (3-39 characters, alphanumeric and hyphens). */
  username: string;
  /** Valid email address. */
  email: string;
  /** Password (minimum 8 characters). */
  password: string;
  /** Display name. */
  displayName: string;
  /** Optional avatar URL. */
  avatarUrl?: string;
  /** Optional bio / description. */
  bio?: string;
  /** Optional timezone (IANA identifier). */
  timezone?: string;
}

/**
 * Schema for updating an existing user profile.
 */
export interface UpdateUserSchema {
  /** Updated display name. */
  displayName?: string;
  /** Updated email address. */
  email?: string;
  /** Updated avatar URL. */
  avatarUrl?: string;
  /** Updated bio. */
  bio?: string;
  /** Updated timezone. */
  timezone?: string;
  /** Updated locale (e.g., "en-US"). */
  locale?: string;
  /** Updated notification preferences. */
  notificationPreferences?: UserNotificationPreferencesSchema;
}

/**
 * Schema for user notification preferences.
 */
export interface UserNotificationPreferencesSchema {
  /** Enable email notifications. */
  emailEnabled: boolean;
  /** Enable push notifications. */
  pushEnabled: boolean;
  /** Enable in-app notifications. */
  inAppEnabled: boolean;
  /** Digest frequency. */
  digestFrequency: DigestFrequency;
}

/**
 * Frequency for notification digests.
 */
export type DigestFrequency = "realtime" | "hourly" | "daily" | "weekly" | "never";

/**
 * Schema for changing a user's password.
 */
export interface ChangePasswordSchema {
  /** Current password for verification. */
  currentPassword: string;
  /** New password (minimum 8 characters). */
  newPassword: string;
  /** Confirmation of the new password. */
  confirmPassword: string;
}

/**
 * Schema for user login.
 */
export interface LoginSchema {
  /** Email or username. */
  identifier: string;
  /** Password. */
  password: string;
  /** Optional MFA code. */
  mfaCode?: string;
  /** Whether to persist the session ("remember me"). */
  rememberMe?: boolean;
}

/**
 * Schema for requesting a password reset.
 */
export interface PasswordResetRequestSchema {
  /** Email address associated with the account. */
  email: string;
}

/**
 * Schema for completing a password reset.
 */
export interface PasswordResetSchema {
  /** Reset token received via email. */
  token: string;
  /** New password. */
  newPassword: string;
  /** Confirmation of the new password. */
  confirmPassword: string;
}

/**
 * Schema for user search / filtering queries.
 */
export interface UserSearchSchema {
  /** Search query string. */
  query?: string;
  /** Filter by role. */
  role?: string;
  /** Filter by active status. */
  isActive?: boolean;
  /** Filter by organization ID. */
  organizationId?: string;
  /** Page number. */
  page?: number;
  /** Items per page. */
  perPage?: number;
}
