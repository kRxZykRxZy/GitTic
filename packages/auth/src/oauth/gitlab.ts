/**
 * GitLab OAuth 2.0 provider implementation.
 * Handles GitLab authorization flow including URL building,
 * token exchange, and user profile fetching.
 * @module oauth/gitlab
 */

import type {
  OAuthConfig,
  OAuthToken,
  OAuthProfile,
  OAuthProvider,
} from "./oauth-types.js";
import { OAuthError } from "./oauth-types.js";

/**
 * GitLab user API response structure.
 */
interface GitLabUserResponse {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url: string;
  web_url: string;
  state: string;
  bio: string | null;
  location: string | null;
  confirmed_at: string | null;
  two_factor_enabled: boolean;
}

/**
 * Default GitLab OAuth endpoint URLs (for gitlab.com).
 */
const GITLAB_DEFAULTS = {
  baseUrl: "https://gitlab.com",
  authorizationUrl: "https://gitlab.com/oauth/authorize",
  tokenUrl: "https://gitlab.com/oauth/token",
  profileUrl: "https://gitlab.com/api/v4/user",
  scopes: ["read_user", "openid", "email"],
} as const;

/**
 * Create a GitLab OAuth provider configuration.
 * @param clientId - GitLab application ID
 * @param clientSecret - GitLab application secret
 * @param redirectUri - Registered callback URL
 * @param options - Optional overrides for self-hosted GitLab instances
 * @returns Complete OAuthConfig for GitLab
 */
export function createGitLabConfig(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  options?: { baseUrl?: string; scopes?: string[] }
): OAuthConfig {
  const baseUrl = options?.baseUrl ?? GITLAB_DEFAULTS.baseUrl;

  return {
    provider: "gitlab",
    clientId,
    clientSecret,
    redirectUri,
    scopes: options?.scopes ?? [...GITLAB_DEFAULTS.scopes],
    authorizationUrl: `${baseUrl}/oauth/authorize`,
    tokenUrl: `${baseUrl}/oauth/token`,
    profileUrl: `${baseUrl}/api/v4/user`,
  };
}

/**
 * Build the GitLab authorization URL.
 * @param config - GitLab OAuth configuration
 * @param state - CSRF state parameter
 * @returns Full authorization URL for redirect
 */
export function buildGitLabAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state,
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange a GitLab authorization code for access tokens.
 * @param config - GitLab OAuth configuration
 * @param code - Authorization code from the callback
 * @returns OAuth token response
 * @throws OAuthError if the exchange fails
 */
export async function exchangeGitLabCode(
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
      `GitLab token exchange failed: ${response.status} - ${errorBody}`,
      response.status,
      "gitlab"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (data.error) {
    throw new OAuthError(
      `GitLab OAuth error: ${data.error_description ?? data.error}`,
      400,
      "gitlab"
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
 * Refresh a GitLab access token using a refresh token.
 * @param config - GitLab OAuth configuration
 * @param refreshToken - The refresh token
 * @returns New OAuth token
 * @throws OAuthError if refresh fails
 */
export async function refreshGitLabToken(
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
      `GitLab token refresh failed: ${response.status}`,
      response.status,
      "gitlab"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    tokenType: (data.token_type as string) ?? "bearer",
    expiresIn: data.expires_in as number | undefined,
    refreshToken: (data.refresh_token as string) ?? refreshToken,
    scope: data.scope as string | undefined,
    obtainedAt: Date.now(),
  };
}

/**
 * Fetch the authenticated user's GitLab profile.
 * @param config - GitLab OAuth configuration
 * @param token - OAuth token from code exchange
 * @returns Normalized OAuth profile
 * @throws OAuthError if the profile fetch fails
 */
export async function fetchGitLabProfile(
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
      `GitLab profile fetch failed: ${response.status}`,
      response.status,
      "gitlab"
    );
  }

  const user = (await response.json()) as GitLabUserResponse;
  const emailVerified = user.confirmed_at !== null;

  return {
    providerId: String(user.id),
    provider: "gitlab",
    email: user.email ?? null,
    emailVerified,
    displayName: user.name ?? null,
    username: user.username,
    avatarUrl: user.avatar_url ?? null,
    profileUrl: user.web_url ?? null,
    raw: user as unknown as Record<string, unknown>,
  };
}

/**
 * Complete GitLab OAuth provider implementing the OAuthProvider interface.
 */
export class GitLabOAuthProvider implements OAuthProvider {
  public readonly name = "gitlab" as const;
  private readonly config: OAuthConfig;

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    baseUrl?: string
  ) {
    this.config = createGitLabConfig(clientId, clientSecret, redirectUri, {
      baseUrl,
    });
  }

  /** @inheritdoc */
  getAuthorizationUrl(state: string): string {
    return buildGitLabAuthUrl(this.config, state);
  }

  /** @inheritdoc */
  async exchangeCode(code: string): Promise<OAuthToken> {
    return exchangeGitLabCode(this.config, code);
  }

  /** @inheritdoc */
  async fetchProfile(token: OAuthToken): Promise<OAuthProfile> {
    return fetchGitLabProfile(this.config, token);
  }
}
