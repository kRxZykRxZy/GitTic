/**
 * GitHub OAuth provider implementation.
 * Handles GitHub OAuth 2.0 authorization flow including URL building,
 * token exchange, and user profile fetching.
 * @module oauth/github
 */

import type {
  OAuthConfig,
  OAuthToken,
  OAuthProfile,
  OAuthProvider,
} from "./oauth-types.js";
import { OAuthError } from "./oauth-types.js";

/**
 * GitHub-specific user data returned from the /user endpoint.
 */
interface GitHubUserResponse {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
}

/**
 * GitHub email object from the /user/emails endpoint.
 */
interface GitHubEmail {
  email: string;
  primary: boolean;
  verified: boolean;
  visibility: string | null;
}

/**
 * Default GitHub OAuth configuration values.
 */
const GITHUB_DEFAULTS = {
  authorizationUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  profileUrl: "https://api.github.com/user",
  emailsUrl: "https://api.github.com/user/emails",
  scopes: ["read:user", "user:email"],
} as const;

/**
 * Create a GitHub OAuth provider configuration.
 * @param clientId - GitHub OAuth App client ID
 * @param clientSecret - GitHub OAuth App client secret
 * @param redirectUri - Callback URL registered with GitHub
 * @param scopes - Requested scopes (defaults to read:user and user:email)
 * @returns Complete OAuthConfig for GitHub
 */
export function createGitHubConfig(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  scopes?: string[]
): OAuthConfig {
  return {
    provider: "github",
    clientId,
    clientSecret,
    redirectUri,
    scopes: scopes ?? [...GITHUB_DEFAULTS.scopes],
    authorizationUrl: GITHUB_DEFAULTS.authorizationUrl,
    tokenUrl: GITHUB_DEFAULTS.tokenUrl,
    profileUrl: GITHUB_DEFAULTS.profileUrl,
  };
}

/**
 * Build the GitHub authorization URL that the user should be redirected to.
 * @param config - GitHub OAuth configuration
 * @param state - CSRF state parameter
 * @returns Full authorization URL
 */
export function buildGitHubAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    state,
    allow_signup: "true",
  });
  return `${config.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange a GitHub authorization code for an access token.
 * @param config - GitHub OAuth configuration
 * @param code - Authorization code from the callback
 * @returns OAuth token response
 * @throws OAuthError if the exchange fails
 */
export async function exchangeGitHubCode(
  config: OAuthConfig,
  code: string
): Promise<OAuthToken> {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: config.redirectUri,
    }),
  });

  if (!response.ok) {
    throw new OAuthError(
      `GitHub token exchange failed: ${response.status} ${response.statusText}`,
      response.status,
      "github"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (data.error) {
    throw new OAuthError(
      `GitHub OAuth error: ${data.error_description ?? data.error}`,
      400,
      "github"
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
 * Fetch the primary verified email from GitHub's /user/emails endpoint.
 * @param accessToken - Valid GitHub access token
 * @returns Primary email or null
 */
async function fetchPrimaryEmail(accessToken: string): Promise<GitHubEmail | null> {
  const response = await fetch(GITHUB_DEFAULTS.emailsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const emails = (await response.json()) as GitHubEmail[];
  const primary = emails.find((e) => e.primary && e.verified);
  return primary ?? emails.find((e) => e.verified) ?? null;
}

/**
 * Fetch the authenticated user's GitHub profile.
 * @param config - GitHub OAuth configuration
 * @param token - OAuth token obtained from code exchange
 * @returns Normalized OAuth profile
 * @throws OAuthError if the profile fetch fails
 */
export async function fetchGitHubProfile(
  config: OAuthConfig,
  token: OAuthToken
): Promise<OAuthProfile> {
  const response = await fetch(config.profileUrl, {
    headers: {
      Authorization: `Bearer ${token.accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new OAuthError(
      `GitHub profile fetch failed: ${response.status}`,
      response.status,
      "github"
    );
  }

  const user = (await response.json()) as GitHubUserResponse;

  // Fetch email separately if not included in profile
  let email = user.email;
  let emailVerified = false;
  if (!email) {
    const primaryEmail = await fetchPrimaryEmail(token.accessToken);
    if (primaryEmail) {
      email = primaryEmail.email;
      emailVerified = primaryEmail.verified;
    }
  } else {
    emailVerified = true;
  }

  return {
    providerId: String(user.id),
    provider: "github",
    email,
    emailVerified,
    displayName: user.name,
    username: user.login,
    avatarUrl: user.avatar_url,
    profileUrl: user.html_url,
    raw: user as unknown as Record<string, unknown>,
  };
}

/**
 * Complete GitHub OAuth provider implementing the OAuthProvider interface.
 */
export class GitHubOAuthProvider implements OAuthProvider {
  public readonly name = "github" as const;
  private readonly config: OAuthConfig;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.config = createGitHubConfig(clientId, clientSecret, redirectUri);
  }

  /** @inheritdoc */
  getAuthorizationUrl(state: string): string {
    return buildGitHubAuthUrl(this.config, state);
  }

  /** @inheritdoc */
  async exchangeCode(code: string): Promise<OAuthToken> {
    return exchangeGitHubCode(this.config, code);
  }

  /** @inheritdoc */
  async fetchProfile(token: OAuthToken): Promise<OAuthProfile> {
    return fetchGitHubProfile(this.config, token);
  }
}
