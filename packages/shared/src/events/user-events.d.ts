/**
 * User-related event types for account and session lifecycle.
 * @module events/user-events
 */
import type { BaseEvent } from "./event-types.js";
/**
 * Payload for user registration events.
 */
export interface UserRegisteredPayload {
    /** ID of the newly registered user. */
    userId: string;
    /** Username chosen during registration. */
    username: string;
    /** Email address used for registration. */
    email: string;
    /** Registration method. */
    registrationMethod: RegistrationMethod;
    /** Whether email verification is pending. */
    emailVerified: boolean;
    /** Referral source (if applicable). */
    referralSource?: string;
}
/**
 * Event emitted when a new user registers.
 */
export type UserRegisteredEvent = BaseEvent<UserRegisteredPayload>;
/**
 * Payload for user login events.
 */
export interface UserLoginPayload {
    /** ID of the user who logged in. */
    userId: string;
    /** Login method used. */
    loginMethod: LoginMethod;
    /** Whether multi-factor authentication was used. */
    mfaUsed: boolean;
    /** ID of the new session. */
    sessionId: string;
    /** IP address of the client. */
    ipAddress: string;
    /** User agent of the client. */
    userAgent: string;
    /** ISO-8601 timestamp of the login. */
    loginAt: string;
}
/**
 * Event emitted when a user logs in.
 */
export type UserLoginEvent = BaseEvent<UserLoginPayload>;
/**
 * Payload for user logout events.
 */
export interface UserLogoutPayload {
    /** ID of the user who logged out. */
    userId: string;
    /** ID of the session that was terminated. */
    sessionId: string;
    /** Reason for logout. */
    reason: LogoutReason;
}
/**
 * Event emitted when a user logs out.
 */
export type UserLogoutEvent = BaseEvent<UserLogoutPayload>;
/**
 * Registration methods supported by the platform.
 */
export type RegistrationMethod = "email" | "oauth_github" | "oauth_google" | "sso" | "invitation";
/**
 * Login methods supported by the platform.
 */
export type LoginMethod = "password" | "oauth_github" | "oauth_google" | "sso" | "api_key" | "token";
/**
 * Reasons for a user session ending.
 */
export type LogoutReason = "user_initiated" | "session_expired" | "forced" | "password_changed" | "account_disabled";
/**
 * Payload for user profile update events.
 */
export interface UserProfileUpdatedPayload {
    /** ID of the user. */
    userId: string;
    /** Fields that were updated. */
    updatedFields: string[];
    /** Whether the email was changed. */
    emailChanged: boolean;
    /** Whether the password was changed. */
    passwordChanged: boolean;
}
/**
 * Event emitted when a user updates their profile.
 */
export type UserProfileUpdatedEvent = BaseEvent<UserProfileUpdatedPayload>;
/**
 * Payload for user account deletion events.
 */
export interface UserDeletedPayload {
    /** ID of the user being deleted. */
    userId: string;
    /** Username (captured before deletion). */
    username: string;
    /** Reason for deletion. */
    reason: AccountDeletionReason;
    /** ISO-8601 timestamp when data will be fully purged. */
    dataPurgeAt: string;
}
/**
 * Event emitted when a user account is deleted.
 */
export type UserDeletedEvent = BaseEvent<UserDeletedPayload>;
/**
 * Reasons for account deletion.
 */
export type AccountDeletionReason = "user_requested" | "admin_action" | "policy_violation" | "inactivity";
//# sourceMappingURL=user-events.d.ts.map