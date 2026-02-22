/**
 * Multi-provider OAuth manager.
 * Orchestrates OAuth flows across multiple providers, handling
 * provider registration, flow initiation, and callback processing.
 * @module oauth/oauth-manager
 */

import type {
  OAuthProvider,
  OAuthProviderName,
  OAuthToken,
  OAuthProfile,
  OAuthCallbackResult,
  OAuthState,
} from "./oauth-types.js";
import { OAuthError } from "./oauth-types.js";
import {
  createOAuthState,
  validateOAuthState,
  type OAuthStateConfig,
} from "./oauth-state.js";

/**
 * Configuration for the OAuthManager.
 */
export interface OAuthManagerConfig {
  /** Secret for signing state tokens */
  stateSigningSecret: string;
  /** TTL for state tokens in milliseconds */
  stateTtlMs?: number;
  /** Maximum pending state tokens */
  maxPendingStates?: number;
  /** Default return URL after auth */
  defaultReturnTo?: string;
}

/**
 * Result of initiating an OAuth flow.
 */
export interface OAuthFlowInitiation {
  /** URL to redirect the user to */
  authorizationUrl: string;
  /** The state string for verification during callback */
  state: string;
  /** The provider being used */
  provider: OAuthProviderName;
}

/**
 * Manages multiple OAuth providers and orchestrates the OAuth flow.
 */
export class OAuthManager {
  private readonly providers = new Map<OAuthProviderName, OAuthProvider>();
  private readonly stateConfig: OAuthStateConfig;
  private readonly defaultReturnTo: string;

  /**
   * Create a new OAuthManager.
   * @param config - Manager configuration
   */
  constructor(config: OAuthManagerConfig) {
    this.stateConfig = {
      signingSecret: config.stateSigningSecret,
      ttlMs: config.stateTtlMs,
      maxPendingStates: config.maxPendingStates,
    };
    this.defaultReturnTo = config.defaultReturnTo ?? "/";
  }

  /**
   * Register an OAuth provider with the manager.
   * @param provider - The provider implementation to register
   * @throws OAuthError if a provider with the same name is already registered
   */
  registerProvider(provider: OAuthProvider): void {
    if (this.providers.has(provider.name)) {
      throw new OAuthError(
        `Provider "${provider.name}" is already registered`,
        409,
        provider.name
      );
    }
    this.providers.set(provider.name, provider);
  }

  /**
   * Unregister an OAuth provider.
   * @param name - Provider name to remove
   * @returns True if the provider was removed
   */
  unregisterProvider(name: OAuthProviderName): boolean {
    return this.providers.delete(name);
  }

  /**
   * Get a registered provider by name.
   * @param name - Provider name
   * @returns The provider or undefined
   */
  getProvider(name: OAuthProviderName): OAuthProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * List all registered provider names.
   * @returns Array of registered provider names
   */
  listProviders(): OAuthProviderName[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if a provider is registered.
   * @param name - Provider name to check
   * @returns True if the provider is registered
   */
  hasProvider(name: OAuthProviderName): boolean {
    return this.providers.has(name);
  }

  /**
   * Initiate an OAuth flow for a specific provider.
   * Generates a CSRF-safe state token and returns the authorization URL.
   * @param providerName - Which provider to start the flow with
   * @param returnTo - URL to redirect to after successful auth
   * @param metadata - Optional metadata to include in the state
   * @returns Flow initiation result with authorization URL and state
   * @throws OAuthError if the provider is not registered
   */
  initiateFlow(
    providerName: OAuthProviderName,
    returnTo?: string,
    metadata?: Record<string, string>
  ): OAuthFlowInitiation {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new OAuthError(
        `Provider "${providerName}" is not registered`,
        404,
        providerName
      );
    }

    const state = createOAuthState(
      this.stateConfig,
      providerName,
      returnTo ?? this.defaultReturnTo,
      metadata
    );

    const authorizationUrl = provider.getAuthorizationUrl(state);

    return {
      authorizationUrl,
      state,
      provider: providerName,
    };
  }

  /**
   * Handle an OAuth callback from a provider.
   * Validates the state, exchanges the code for tokens, and fetches the profile.
   * @param code - Authorization code from the callback
   * @param stateString - State parameter from the callback
   * @returns Callback result with token, profile, and validated state
   * @throws OAuthError if the state is invalid or any step fails
   */
  async handleCallback(
    code: string,
    stateString: string
  ): Promise<OAuthCallbackResult> {
    const state = validateOAuthState(this.stateConfig, stateString);
    if (!state) {
      throw new OAuthError(
        "Invalid or expired OAuth state parameter",
        400,
        null
      );
    }

    const provider = this.providers.get(state.provider);
    if (!provider) {
      throw new OAuthError(
        `Provider "${state.provider}" is not registered`,
        404,
        state.provider
      );
    }

    const token = await provider.exchangeCode(code);
    const profile = await provider.fetchProfile(token);

    return { token, profile, state };
  }

  /**
   * Validate a state parameter without consuming it.
   * Useful for checking if a state is still valid before processing.
   * @param stateString - The state string to check
   * @returns The validated state or null if invalid
   */
  validateState(stateString: string): OAuthState | null {
    return validateOAuthState(this.stateConfig, stateString);
  }

  /**
   * Get the authorization URL for a provider without creating state.
   * Useful when you manage state externally.
   * @param providerName - Provider name
   * @param state - Externally-managed state string
   * @returns The authorization URL
   * @throws OAuthError if provider is not registered
   */
  getAuthorizationUrl(
    providerName: OAuthProviderName,
    state: string
  ): string {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new OAuthError(
        `Provider "${providerName}" is not registered`,
        404,
        providerName
      );
    }
    return provider.getAuthorizationUrl(state);
  }
}
