/**
 * Bitbucket OAuth 2.0 provider implementation.
 * Handles Bitbucket Cloud authorization flow including URL building,
 * token exchange, and user profile fetching.
 * @module oauth/bitbucket
 */

import type {
  OAuthConfig,
  OAuthToken,
  OAuthProfile,
  OAuthProvider,
} from "./oauth-types.js";
import { OAuthError } from "./oauth-types.js";

/**
 * Bitbucket user API response structure.
 */
interface BitbucketUserResponse {
  uuid: string;
  username: string;
  display_name: string;
  account_id: string;
  links: {
    self: { href: string };
    html: { href: string };
    avatar: { href: string };
  };
  type: string;
  created_on: string;
  nickname: string;
}

/**
 * Bitbucket email entry from the /user/emails endpoint.
 */
interface BitbucketEmail {
  email: string;
  is_primary: boolean;
  is_confirmed: boolean;
  type: string;
}

/**
 * Bitbucket emails API paginated response.
 */
interface BitbucketEmailsResponse {
  values: BitbucketEmail[];
  page: number;
  size: number;
}

/**
 * Default Bitbucket OAuth endpoint URLs.
 */
const BITBUCKET_DEFAULTS = {
  authorizationUrl: "https://bitbucket.org/site/oauth2/authorize",
  tokenUrl: "https://bitbucket.org/site/oauth2/access_token",
  profileUrl: "https://api.bitbucket.org/2.0/user",
  emailsUrl: "https://api.bitbucket.org/2.0/user/emails",
  scopes: ["account", "email"],
} as const;

/**
 * Create a Bitbucket OAuth provider configuration.
 * @param clientId - Bitbucket OAuth consumer key
 * @param clientSecret - Bitbucket OAuth consumer secret
 * @param redirectUri - Registered callback URL
 * @param scopes - Requested scopes
 * @returns Complete OAuthConfig for Bitbucket
 */
export function createBitbucketConfig(
  clientId: string,
  clientSecret: string,
  redirectUri: string,
  scopes?: string[]
): OAuthConfig {
  return {
    provider: "bitbucket",
    clientId,
    clientSecret,
    redirectUri,
    scopes: scopes ?? [...BITBUCKET_DEFAULTS.scopes],
    authorizationUrl: BITBUCKET_DEFAULTS.authorizationUrl,
    tokenUrl: BITBUCKET_DEFAULTS.tokenUrl,
    profileUrl: BITBUCKET_DEFAULTS.profileUrl,
  };
}

/**
 * Build the Bitbucket authorization URL for user consent.
 * @param config - Bitbucket OAuth configuration
 * @param state - CSRF state parameter
 * @returns Full authorization URL
 */
export function buildBitbucketAuthUrl(
  config: OAuthConfig,
  state: string
): string {
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
 * Exchange a Bitbucket authorization code for tokens.
 * Bitbucket uses HTTP Basic auth for client credentials.
 * @param config - Bitbucket OAuth configuration
 * @param code - Authorization code from the callback
 * @returns OAuth token response
 * @throws OAuthError if the exchange fails
 */
export async function exchangeBitbucketCode(
  config: OAuthConfig,
  code: string
): Promise<OAuthToken> {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
      Accept: "application/json",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new OAuthError(
      `Bitbucket token exchange failed: ${response.status} - ${errorBody}`,
      response.status,
      "bitbucket"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  if (data.error) {
    throw new OAuthError(
      `Bitbucket OAuth error: ${data.error_description ?? data.error}`,
      400,
      "bitbucket"
    );
  }

  return {
    accessToken: data.access_token as string,
    tokenType: (data.token_type as string) ?? "bearer",
    expiresIn: data.expires_in as number | undefined,
    refreshToken: data.refresh_token as string | undefined,
    scope: data.scopes as string | undefined,
    obtainedAt: Date.now(),
  };
}

/**
 * Refresh a Bitbucket access token using a refresh token.
 * @param config - Bitbucket OAuth configuration
 * @param refreshToken - The refresh token to use
 * @returns New OAuth token
 * @throws OAuthError if the refresh fails
 */
export async function refreshBitbucketToken(
  config: OAuthConfig,
  refreshToken: string
): Promise<OAuthToken> {
  const credentials = Buffer.from(
    `${config.clientId}:${config.clientSecret}`
  ).toString("base64");

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${credentials}`,
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new OAuthError(
      `Bitbucket token refresh failed: ${response.status}`,
      response.status,
      "bitbucket"
    );
  }

  const data = (await response.json()) as Record<string, unknown>;

  return {
    accessToken: data.access_token as string,
    tokenType: (data.token_type as string) ?? "bearer",
    expiresIn: data.expires_in as number | undefined,
    refreshToken: (data.refresh_token as string) ?? refreshToken,
    scope: data.scopes as string | undefined,
    obtainedAt: Date.now(),
  };
}

/**
 * Fetch the authenticated user's primary email from Bitbucket.
 * @param accessToken - Valid Bitbucket access token
 * @returns Primary confirmed email or null
 */
async function fetchBitbucketEmail(
  accessToken: string
): Promise<BitbucketEmail | null> {
  const response = await fetch(BITBUCKET_DEFAULTS.emailsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as BitbucketEmailsResponse;
  const primary = data.values.find((e) => e.is_primary && e.is_confirmed);
  return primary ?? data.values.find((e) => e.is_confirmed) ?? null;
}

/**
 * Fetch the authenticated user's Bitbucket profile.
 * @param config - Bitbucket OAuth configuration
 * @param token - OAuth token from code exchange
 * @returns Normalized OAuth profile
 * @throws OAuthError if the profile fetch fails
 */
export async function fetchBitbucketProfile(
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
      `Bitbucket profile fetch failed: ${response.status}`,
      response.status,
      "bitbucket"
    );
  }

  const user = (await response.json()) as BitbucketUserResponse;

  // Fetch email from separate endpoint
  const emailData = await fetchBitbucketEmail(token.accessToken);

  return {
    providerId: user.uuid,
    provider: "bitbucket",
    email: emailData?.email ?? null,
    emailVerified: emailData?.is_confirmed ?? false,
    displayName: user.display_name ?? null,
    username: user.username ?? user.nickname,
    avatarUrl: user.links?.avatar?.href ?? null,
    profileUrl: user.links?.html?.href ?? null,
    raw: user as unknown as Record<string, unknown>,
  };
}

/**
 * Complete Bitbucket OAuth provider implementing the OAuthProvider interface.
 */
export class BitbucketOAuthProvider implements OAuthProvider {
  public readonly name = "bitbucket" as const;
  private readonly config: OAuthConfig;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.config = createBitbucketConfig(clientId, clientSecret, redirectUri);
  }

  /** @inheritdoc */
  getAuthorizationUrl(state: string): string {
    return buildBitbucketAuthUrl(this.config, state);
  }

  /** @inheritdoc */
  async exchangeCode(code: string): Promise<OAuthToken> {
    return exchangeBitbucketCode(this.config, code);
  }

  /** @inheritdoc */
  async fetchProfile(token: OAuthToken): Promise<OAuthProfile> {
    return fetchBitbucketProfile(this.config, token);
  }
}
