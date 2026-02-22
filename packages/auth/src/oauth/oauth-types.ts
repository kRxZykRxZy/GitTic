/**
 * Shared OAuth types used across all OAuth provider implementations.
 * @module oauth/oauth-types
 */

/**
 * Supported OAuth provider identifiers.
 */
export type OAuthProviderName = "github" | "google" | "gitlab" | "bitbucket";

/**
 * Configuration required for an OAuth provider.
 */
export interface OAuthConfig {
  /** OAuth provider identifier */
  provider: OAuthProviderName;
  /** OAuth client ID */
  clientId: string;
  /** OAuth client secret */
  clientSecret: string;
  /** URL to redirect to after authorization */
  redirectUri: string;
  /** Requested permission scopes */
  scopes: string[];
  /** Authorization endpoint URL */
  authorizationUrl: string;
  /** Token exchange endpoint URL */
  tokenUrl: string;
  /** User profile endpoint URL */
  profileUrl: string;
  /** Additional provider-specific parameters */
  extraParams?: Record<string, string>;
}

/**
 * OAuth access token response from the provider.
 */
export interface OAuthToken {
  /** The access token string */
  accessToken: string;
  /** Token type (usually "bearer") */
  tokenType: string;
  /** Expiry time in seconds (if provided) */
  expiresIn?: number;
  /** Refresh token (if provided) */
  refreshToken?: string;
  /** Granted scopes */
  scope?: string;
  /** Timestamp when the token was obtained */
  obtainedAt: number;
}

/**
 * Normalized user profile returned by any OAuth provider.
 */
export interface OAuthProfile {
  /** Provider-specific unique user ID */
  providerId: string;
  /** OAuth provider name */
  provider: OAuthProviderName;
  /** User's email address */
  email: string | null;
  /** Whether the email is verified by the provider */
  emailVerified: boolean;
  /** Display name */
  displayName: string | null;
  /** Username or login handle */
  username: string | null;
  /** Avatar/profile picture URL */
  avatarUrl: string | null;
  /** Profile page URL on the provider */
  profileUrl: string | null;
  /** Raw profile data from the provider */
  raw: Record<string, unknown>;
}

/**
 * State parameter for OAuth CSRF protection.
 */
export interface OAuthState {
  /** Random nonce for CSRF protection */
  nonce: string;
  /** Provider being used */
  provider: OAuthProviderName;
  /** Where to redirect the user after successful auth */
  returnTo?: string;
  /** Timestamp when the state was created */
  createdAt: number;
  /** Optional additional metadata */
  metadata?: Record<string, string>;
}

/**
 * Result of an OAuth callback handling.
 */
export interface OAuthCallbackResult {
  /** The OAuth tokens received */
  token: OAuthToken;
  /** Normalized user profile */
  profile: OAuthProfile;
  /** The validated state from the callback */
  state: OAuthState;
}

/**
 * Interface that all OAuth providers must implement.
 */
export interface OAuthProvider {
  /** Provider identifier */
  readonly name: OAuthProviderName;
  /** Build the authorization URL for the provider */
  getAuthorizationUrl(state: string): string;
  /** Exchange an authorization code for tokens */
  exchangeCode(code: string): Promise<OAuthToken>;
  /** Fetch the user profile using the access token */
  fetchProfile(token: OAuthToken): Promise<OAuthProfile>;
}

/**
 * Error thrown during OAuth operations.
 */
export class OAuthError extends Error {
  /** HTTP status code if applicable */
  public readonly statusCode: number;
  /** OAuth provider that caused the error */
  public readonly provider: OAuthProviderName | null;

  constructor(
    message: string,
    statusCode: number = 500,
    provider: OAuthProviderName | null = null
  ) {
    super(message);
    this.name = "OAuthError";
    this.statusCode = statusCode;
    this.provider = provider;
  }
}
