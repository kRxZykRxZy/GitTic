/**
 * Third-party integration types and configuration.
 * @module models/integration
 */
/**
 * Status of an integration connection.
 */
export type IntegrationStatus = "connected" | "disconnected" | "error" | "pending" | "expired";
/**
 * Authentication method used by the integration.
 */
export type IntegrationAuthType = "oauth2" | "api_key" | "token" | "basic" | "webhook";
/**
 * Category of the integration.
 */
export type IntegrationCategory = "version_control" | "ci_cd" | "monitoring" | "communication" | "issue_tracking" | "cloud_provider" | "container_registry" | "artifact_storage" | "security" | "analytics";
/**
 * A configured integration with an external service.
 */
export interface Integration {
    /** Unique identifier for the integration. */
    id: string;
    /** Identifier for the integration provider (e.g., "github", "slack"). */
    provider: string;
    /** Human-readable display name. */
    displayName: string;
    /** Category of the integration. */
    category: IntegrationCategory;
    /** Current connection status. */
    status: IntegrationStatus;
    /** Authentication method used. */
    authType: IntegrationAuthType;
    /** ID of the organization that owns this integration. */
    organizationId: string;
    /** ID of the user who installed the integration. */
    installedBy: string;
    /** Scopes or permissions granted to the integration. */
    scopes: string[];
    /** Provider-specific configuration. */
    config: IntegrationConfig;
    /** ISO-8601 creation timestamp. */
    createdAt: string;
    /** ISO-8601 last-updated timestamp. */
    updatedAt: string;
    /** ISO-8601 timestamp of the last successful sync. */
    lastSyncAt?: string;
    /** Error message if the integration is in error state. */
    errorMessage?: string;
}
/**
 * Provider-specific configuration for an integration.
 */
export interface IntegrationConfig {
    /** Base URL of the external service (for self-hosted instances). */
    baseUrl?: string;
    /** Webhook URL registered with the external service. */
    webhookUrl?: string;
    /** Additional provider-specific settings. */
    settings?: Record<string, unknown>;
}
/**
 * OAuth2 token information for an integration.
 */
export interface IntegrationOAuthToken {
    /** The access token. */
    accessToken: string;
    /** The refresh token. */
    refreshToken?: string;
    /** Token type (usually "Bearer"). */
    tokenType: string;
    /** Scopes granted by the token. */
    scopes: string[];
    /** ISO-8601 expiration timestamp. */
    expiresAt: string;
}
/**
 * Describes an available integration provider on the marketplace.
 */
export interface IntegrationProvider {
    /** Machine-readable provider identifier. */
    id: string;
    /** Human-readable name. */
    name: string;
    /** Short description of what the integration does. */
    description: string;
    /** Category of the integration. */
    category: IntegrationCategory;
    /** URL to the provider's logo image. */
    logoUrl: string;
    /** Authentication type required. */
    authType: IntegrationAuthType;
    /** Required scopes / permissions. */
    requiredScopes: string[];
    /** Documentation URL. */
    docsUrl: string;
    /** Whether this integration is officially supported. */
    isOfficial: boolean;
}
//# sourceMappingURL=integration.d.ts.map