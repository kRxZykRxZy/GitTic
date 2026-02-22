/**
 * Settings schema types for platform and user configuration.
 * @module schemas/settings-schema
 */

/**
 * Schema for platform-wide settings (admin only).
 */
export interface PlatformSettingsSchema {
  /** Platform display name. */
  siteName: string;
  /** Platform description. */
  siteDescription: string;
  /** URL to the platform logo. */
  logoUrl?: string;
  /** URL to the platform favicon. */
  faviconUrl?: string;
  /** Whether new user registration is enabled. */
  registrationEnabled: boolean;
  /** Whether email verification is required. */
  emailVerificationRequired: boolean;
  /** Default role for new users. */
  defaultUserRole: string;
  /** Maximum file upload size in megabytes. */
  maxUploadSizeMb: number;
  /** Allowed authentication providers. */
  authProviders: AuthProviderSetting[];
  /** Session settings. */
  session: SessionSettingsSchema;
  /** Security settings. */
  security: SecuritySettingsSchema;
}

/**
 * Configuration for an authentication provider.
 */
export interface AuthProviderSetting {
  /** Provider identifier (e.g., "github", "google"). */
  provider: string;
  /** Whether this provider is enabled. */
  enabled: boolean;
  /** Client ID for OAuth. */
  clientId: string;
  /** Display name shown in the login UI. */
  displayName: string;
  /** Icon URL for the provider. */
  iconUrl?: string;
}

/**
 * Schema for session-related settings.
 */
export interface SessionSettingsSchema {
  /** Session timeout in minutes. */
  timeoutMinutes: number;
  /** Maximum number of concurrent sessions per user. */
  maxConcurrentSessions: number;
  /** Whether to extend session on activity. */
  extendOnActivity: boolean;
  /** Cookie settings. */
  cookie: CookieSettingsSchema;
}

/**
 * Schema for session cookie configuration.
 */
export interface CookieSettingsSchema {
  /** Cookie name. */
  name: string;
  /** Whether the cookie is HTTP-only. */
  httpOnly: boolean;
  /** Whether the cookie requires HTTPS. */
  secure: boolean;
  /** SameSite attribute. */
  sameSite: SameSitePolicy;
  /** Cookie domain. */
  domain?: string;
}

/**
 * SameSite cookie policy values.
 */
export type SameSitePolicy = "strict" | "lax" | "none";

/**
 * Schema for security-related settings.
 */
export interface SecuritySettingsSchema {
  /** Whether two-factor authentication is globally required. */
  requireTwoFactor: boolean;
  /** Password minimum length. */
  passwordMinLength: number;
  /** Whether passwords must contain uppercase letters. */
  passwordRequireUppercase: boolean;
  /** Whether passwords must contain numbers. */
  passwordRequireNumbers: boolean;
  /** Whether passwords must contain special characters. */
  passwordRequireSpecialChars: boolean;
  /** Maximum failed login attempts before lockout. */
  maxLoginAttempts: number;
  /** Lockout duration in minutes. */
  lockoutDurationMinutes: number;
  /** IP allowlist for admin access (empty = all allowed). */
  adminIpAllowlist: string[];
}

/**
 * Schema for user-specific appearance settings.
 */
export interface UserAppearanceSchema {
  /** UI theme. */
  theme: ThemePreference;
  /** Whether to use compact mode. */
  compactMode: boolean;
  /** UI density. */
  density: UiDensity;
  /** Font size preference. */
  fontSize: FontSize;
  /** Code editor theme. */
  editorTheme: string;
  /** Whether to show line numbers in code views. */
  showLineNumbers: boolean;
  /** Tab size in code views. */
  tabSize: number;
}

/**
 * Theme preference options.
 */
export type ThemePreference = "light" | "dark" | "system";

/**
 * UI density options.
 */
export type UiDensity = "comfortable" | "compact" | "spacious";

/**
 * Font size preferences.
 */
export type FontSize = "small" | "medium" | "large";
