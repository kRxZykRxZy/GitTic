/**
 * Standardised error message constants for consistent user-facing messages.
 * @module constants/error-messages
 */
/**
 * Authentication-related error messages.
 */
export declare const AUTH_ERRORS: {
    /** Invalid credentials provided. */
    readonly INVALID_CREDENTIALS: "The email or password you entered is incorrect.";
    /** Session has expired. */
    readonly SESSION_EXPIRED: "Your session has expired. Please sign in again.";
    /** Account is locked. */
    readonly ACCOUNT_LOCKED: "Your account has been temporarily locked due to too many failed login attempts.";
    /** Email not verified. */
    readonly EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.";
    /** Token expired. */
    readonly TOKEN_EXPIRED: "The token has expired. Please request a new one.";
    /** Invalid token. */
    readonly INVALID_TOKEN: "The token is invalid or has already been used.";
    /** MFA required. */
    readonly MFA_REQUIRED: "Two-factor authentication is required for this action.";
    /** MFA code invalid. */
    readonly MFA_INVALID: "The two-factor authentication code is incorrect.";
    /** Insufficient permissions. */
    readonly INSUFFICIENT_PERMISSIONS: "You do not have permission to perform this action.";
    /** API key invalid. */
    readonly INVALID_API_KEY: "The API key is invalid or has been revoked.";
};
/**
 * Validation-related error messages.
 */
export declare const VALIDATION_ERRORS: {
    /** Required field missing. */
    readonly REQUIRED_FIELD: "This field is required.";
    /** Invalid email format. */
    readonly INVALID_EMAIL: "Please enter a valid email address.";
    /** Invalid URL format. */
    readonly INVALID_URL: "Please enter a valid URL.";
    /** String too short. */
    readonly TOO_SHORT: "This field must be at least {min} characters long.";
    /** String too long. */
    readonly TOO_LONG: "This field must not exceed {max} characters.";
    /** Invalid username format. */
    readonly INVALID_USERNAME: "Username must be 3-39 characters and contain only letters, numbers, and hyphens.";
    /** Password too weak. */
    readonly WEAK_PASSWORD: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
    /** Passwords do not match. */
    readonly PASSWORD_MISMATCH: "Passwords do not match.";
    /** Duplicate entry. */
    readonly DUPLICATE: "A resource with this value already exists.";
    /** Invalid slug format. */
    readonly INVALID_SLUG: "Slug must contain only lowercase letters, numbers, and hyphens.";
    /** Invalid date format. */
    readonly INVALID_DATE: "Please enter a valid date in ISO 8601 format.";
    /** Value out of range. */
    readonly OUT_OF_RANGE: "Value must be between {min} and {max}.";
};
/**
 * Resource-related error messages.
 */
export declare const RESOURCE_ERRORS: {
    /** Resource not found. */
    readonly NOT_FOUND: "The requested resource was not found.";
    /** Resource already exists. */
    readonly ALREADY_EXISTS: "A resource with this identifier already exists.";
    /** Resource conflict. */
    readonly CONFLICT: "The resource has been modified by another request. Please refresh and try again.";
    /** Resource archived. */
    readonly ARCHIVED: "This resource has been archived and cannot be modified.";
    /** Quota exceeded. */
    readonly QUOTA_EXCEEDED: "You have reached the maximum number of {resource} allowed on your plan.";
    /** Rate limit exceeded. */
    readonly RATE_LIMITED: "Too many requests. Please try again in {seconds} seconds.";
};
/**
 * Server-related error messages.
 */
export declare const SERVER_ERRORS: {
    /** Generic internal error. */
    readonly INTERNAL: "An unexpected error occurred. Please try again later.";
    /** Service unavailable. */
    readonly SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.";
    /** Gateway timeout. */
    readonly GATEWAY_TIMEOUT: "The request timed out. Please try again.";
    /** Maintenance mode. */
    readonly MAINTENANCE: "The platform is currently undergoing maintenance. Please check back soon.";
};
/**
 * All error message collections combined.
 */
export declare const ERROR_MESSAGES: {
    readonly AUTH: {
        /** Invalid credentials provided. */
        readonly INVALID_CREDENTIALS: "The email or password you entered is incorrect.";
        /** Session has expired. */
        readonly SESSION_EXPIRED: "Your session has expired. Please sign in again.";
        /** Account is locked. */
        readonly ACCOUNT_LOCKED: "Your account has been temporarily locked due to too many failed login attempts.";
        /** Email not verified. */
        readonly EMAIL_NOT_VERIFIED: "Please verify your email address before signing in.";
        /** Token expired. */
        readonly TOKEN_EXPIRED: "The token has expired. Please request a new one.";
        /** Invalid token. */
        readonly INVALID_TOKEN: "The token is invalid or has already been used.";
        /** MFA required. */
        readonly MFA_REQUIRED: "Two-factor authentication is required for this action.";
        /** MFA code invalid. */
        readonly MFA_INVALID: "The two-factor authentication code is incorrect.";
        /** Insufficient permissions. */
        readonly INSUFFICIENT_PERMISSIONS: "You do not have permission to perform this action.";
        /** API key invalid. */
        readonly INVALID_API_KEY: "The API key is invalid or has been revoked.";
    };
    readonly VALIDATION: {
        /** Required field missing. */
        readonly REQUIRED_FIELD: "This field is required.";
        /** Invalid email format. */
        readonly INVALID_EMAIL: "Please enter a valid email address.";
        /** Invalid URL format. */
        readonly INVALID_URL: "Please enter a valid URL.";
        /** String too short. */
        readonly TOO_SHORT: "This field must be at least {min} characters long.";
        /** String too long. */
        readonly TOO_LONG: "This field must not exceed {max} characters.";
        /** Invalid username format. */
        readonly INVALID_USERNAME: "Username must be 3-39 characters and contain only letters, numbers, and hyphens.";
        /** Password too weak. */
        readonly WEAK_PASSWORD: "Password must be at least 8 characters and include uppercase, lowercase, number, and special character.";
        /** Passwords do not match. */
        readonly PASSWORD_MISMATCH: "Passwords do not match.";
        /** Duplicate entry. */
        readonly DUPLICATE: "A resource with this value already exists.";
        /** Invalid slug format. */
        readonly INVALID_SLUG: "Slug must contain only lowercase letters, numbers, and hyphens.";
        /** Invalid date format. */
        readonly INVALID_DATE: "Please enter a valid date in ISO 8601 format.";
        /** Value out of range. */
        readonly OUT_OF_RANGE: "Value must be between {min} and {max}.";
    };
    readonly RESOURCE: {
        /** Resource not found. */
        readonly NOT_FOUND: "The requested resource was not found.";
        /** Resource already exists. */
        readonly ALREADY_EXISTS: "A resource with this identifier already exists.";
        /** Resource conflict. */
        readonly CONFLICT: "The resource has been modified by another request. Please refresh and try again.";
        /** Resource archived. */
        readonly ARCHIVED: "This resource has been archived and cannot be modified.";
        /** Quota exceeded. */
        readonly QUOTA_EXCEEDED: "You have reached the maximum number of {resource} allowed on your plan.";
        /** Rate limit exceeded. */
        readonly RATE_LIMITED: "Too many requests. Please try again in {seconds} seconds.";
    };
    readonly SERVER: {
        /** Generic internal error. */
        readonly INTERNAL: "An unexpected error occurred. Please try again later.";
        /** Service unavailable. */
        readonly SERVICE_UNAVAILABLE: "The service is temporarily unavailable. Please try again later.";
        /** Gateway timeout. */
        readonly GATEWAY_TIMEOUT: "The request timed out. Please try again.";
        /** Maintenance mode. */
        readonly MAINTENANCE: "The platform is currently undergoing maintenance. Please check back soon.";
    };
};
//# sourceMappingURL=error-messages.d.ts.map