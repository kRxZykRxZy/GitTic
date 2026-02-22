/**
 * Google OAuth 2.0 provider implementation.
 * Handles Google authorization flow including URL building,
 * token exchange, and userinfo endpoint access.
 * @module oauth/google
 */

import type {
  OAuthConfig,
  OAuthToken,
  OAuthProfile,
  OAuthProvider,
} from "./oauth-types.js";
import { OAuthError } from "./oauth-types.js";

/**
 * Google userinfo response structure.
 */
interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
}

/**
 * Default Google OAuth endpoint URLs.
 */
const GOOGLE_DEFAULTS = {
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  profileUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
  scopes: ["openid", "email", "profile"],
} as const;

/**
 * Create a Google OAuth provider configuration.
 * @param clientId - Google Cloud OAuth client ID
 * @param clientSecret - Google Cloud OAuth client secret
 * @param redirectUri - Registered redirect/callback URL
 * @param scopes - Requested scopes (defaults to openid, email, profile)
 * @returns Complete OAuthConfig for Google
 */
export function createGoogleConfig(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  scopes?: string[]
): OAuthConfig {
  return {
    provider: "google",
    clientId,
    clientSecret,
    redirectUri,
    scopes: scopes ?? [...GOOGLE_DEFAULTS.scopes],
    authorizationUrl: GOOGLE_DEFAULTS.authorizationUrl,
    tokenUrl: GOOGLE_DEFAULTS.tokenUrl,
    profileUrl: GOOGLE_DEFAULTS.profileUrl,
  };
}

/**
 * Build the Google authorization URL for user consent.
 * @param config - Google OAuth configuration
 * @param state - CSRF state parameter
 * @param prompt - Optional prompt behavior (e.g. "consent", "select_account")
 * @returns Full authorization URL
 */
export function buildGoogleAuthUrl(
  config: OAuthConfig,
  state: string,
  prompt?: string
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
    access_type: "offline",
  });

  if (prompt) {
    params.set("prompt", prompt);
  }

  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange a Google authorization code for tokens.
 * @param config - Google OAuth configuration
 * @param code - Authorization code from the callback
 * @returns OAuth token response including access and optional refresh tokens
 * @throws OAuthError if the exchange fails
 */
export async function exchangeGoogleCode(
  config: OAuthConfig,
  code: string
): Promise<OAuthToken> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new OAuthError(
      `Google token exchange failed: ${response.status} - ${errorBody}`,
      response.status,
      "google"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (data.error) {
    throw new OAuthError(
      `Google OAuth error: ${data.error_description ?? data.error}`,
      400,
      "google"
    );
  }

  return {
    accessToken: data.access_token as string,
    tokenType: (data.token_type as string) ?? "bearer",
    expiresIn: data.expires_in as number | undefined,
    refreshToken: data.refresh_token as string | undefined,
    scope: data.scope as string | undefined,
    obtainedAt: Date.now(),
  };
}

/**
 * Refresh a Google access token using a refresh token.
 * @param config - Google OAuth configuration
 * @param refreshToken - The refresh token
 * @returns New OAuth token
 * @throws OAuthError if the refresh fails
 */
export async function refreshGoogleToken(
  config: OAuthConfig,
  refreshToken: string
): Promise<OAuthToken> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new OAuthError(
      `Google token refresh failed: ${response.status}`,
      response.status,
      "google"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    tokenType: (data.token_type as string) ?? "bearer",
    expiresIn: data.expires_in as number | undefined,
    refreshToken,
    scope: data.scope as string | undefined,
    obtainedAt: Date.now(),
  };
}

/**
 * Fetch the authenticated user's Google profile via the userinfo endpoint.
 * @param config - Google OAuth configuration
 * @param token - OAuth token obtained from code exchange
 * @returns Normalized OAuth profile
 * @throws OAuthError if the profile fetch fails
 */
export async function fetchGoogleProfile(
  config: OAuthConfig,
  token: OAuthToken
): Promise<OAuthProfile> {
  const response = await fetch(config.profileUrl, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new OAuthError(
      `Google profile fetch failed: ${response.status}`,
      response.status,
      "google"
    );
  }

  const user = (await response.json()) as GoogleUserInfo;

  return {
    providerId: user.sub,
    provider: "google",
    email: user.email ?? null,
    emailVerified: user.email_verified ?? false,
    displayName: user.name ?? null,
    username: null,
    avatarUrl: user.picture ?? null,
    profileUrl: null,
    raw: user as unknown as Record<string, unknown>,
  };
}

/**
 * Complete Google OAuth provider implementing the OAuthProvider interface.
 */
export class GoogleOAuthProvider implements OAuthProvider {
  public readonly name = "google" as const;
  private readonly config: OAuthConfig;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.config = createGoogleConfig(clientId, clientSecret, redirectUri);
  }

  /** @inheritdoc */
  getAuthorizationUrl(state: string): string {
    return buildGoogleAuthUrl(this.config, state);
  }

  /** @inheritdoc */
  async exchangeCode(code: string): Promise<OAuthToken> {
    return exchangeGoogleCode(this.config, code);
  }

  /** @inheritdoc */
  async fetchProfile(token: OAuthToken): Promise<OAuthProfile> {
    return fetchGoogleProfile(this.config, token);
  }
}
