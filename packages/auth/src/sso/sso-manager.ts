/**
 * SSO manager for configuring and managing SAML-based Single Sign-On.
 * Coordinates IdP configuration, login initiation, callback handling,
 * and attribute-to-user mapping.
 * @module sso/sso-manager
 */

import type {
  SAMLConfig,
  SAMLResponse,
  SAMLMappedUser,
  SAMLAttributeMapping,
  IdentityProvider,
  ServiceProvider,
} from "./saml-types.js";
import { DEFAULT_ATTRIBUTE_MAPPING } from "./saml-types.js";
import {
  buildAuthnRequest,
  buildRedirectUrl,
  decodePostResponse,
  parseSAMLResponse,
  validateAssertionTiming,
  mapAssertionToUser,
  generateRequestId,
} from "./saml-handler.js";

/**
 * SSO login initiation result.
 */
export interface SSOLoginResult {
  /** URL to redirect the user to for IdP authentication */
  redirectUrl: string;
  /** Request ID for correlating with the response */
  requestId: string;
  /** Optional relay state */
  relayState?: string;
}

/**
 * SSO callback processing result.
 */
export interface SSOCallbackResult {
  /** Whether the SSO callback was successful */
  success: boolean;
  /** Mapped user from the assertion */
  user: SAMLMappedUser | null;
  /** Original SAML response */
  response: SAMLResponse;
  /** Error message if unsuccessful */
  error: string | null;
  /** The IdP that authenticated the user */
  idpId: string;
}

/**
 * SSO manager configuration.
 */
export interface SSOManagerConfig {
  /** Service Provider configuration */
  serviceProvider: ServiceProvider;
  /** Default attribute mapping */
  attributeMapping?: SAMLAttributeMapping;
  /** Clock skew tolerance in seconds */
  clockSkewToleranceSec?: number;
  /** Maximum assertion age in seconds */
  maxAssertionAgeSec?: number;
}

/**
 * Pending SSO request stored for validation.
 */
interface PendingSSORequest {
  /** Request ID */
  requestId: string;
  /** IdP ID the request was sent to */
  idpId: string;
  /** When the request was created */
  createdAt: number;
  /** Relay state */
  relayState?: string;
}

/**
 * Manages SSO operations across multiple Identity Providers.
 */
export class SSOManager {
  private readonly sp: ServiceProvider;
  private readonly attributeMapping: SAMLAttributeMapping;
  private readonly clockSkewSec: number;
  private readonly maxAssertionAgeSec: number;
  private readonly idps = new Map<string, IdentityProvider>();
  private readonly pendingRequests = new Map<string, PendingSSORequest>();
  private readonly requestTtlMs = 10 * 60 * 1000;

  /**
   * Create a new SSO manager.
   * @param config - SSO manager configuration
   */
  constructor(config: SSOManagerConfig) {
    this.sp = config.serviceProvider;
    this.attributeMapping =
      config.attributeMapping ?? DEFAULT_ATTRIBUTE_MAPPING;
    this.clockSkewSec = config.clockSkewToleranceSec ?? 300;
    this.maxAssertionAgeSec = config.maxAssertionAgeSec ?? 3600;
  }

  /**
   * Register an Identity Provider.
   * @param idp - Identity Provider configuration
   */
  configureIdP(idp: IdentityProvider): void {
    this.idps.set(idp.id, idp);
  }

  /**
   * Remove an Identity Provider.
   * @param idpId - ID of the IdP to remove
   * @returns True if the IdP was removed
   */
  removeIdP(idpId: string): boolean {
    return this.idps.delete(idpId);
  }

  /**
   * Get a configured Identity Provider by ID.
   * @param idpId - IdP identifier
   * @returns The IdP configuration or undefined
   */
  getIdP(idpId: string): IdentityProvider | undefined {
    return this.idps.get(idpId);
  }

  /**
   * List all configured Identity Providers.
   * @returns Array of IdP configurations
   */
  listIdPs(): IdentityProvider[] {
    return Array.from(this.idps.values());
  }

  /**
   * Initiate an SSO login flow by generating an AuthnRequest and redirect URL.
   * @param idpId - ID of the Identity Provider to authenticate with
   * @param relayState - Optional application state to preserve across the flow
   * @returns Login result with redirect URL and request ID
   * @throws Error if the IdP is not configured
   */
  initiateLogin(idpId: string, relayState?: string): SSOLoginResult {
    const idp = this.idps.get(idpId);
    if (!idp) {
      throw new Error(`Identity Provider "${idpId}" is not configured`);
    }

    const samlConfig = this.buildSAMLConfig(idp);
    const authnRequest = buildAuthnRequest(samlConfig);
    const redirectUrl = buildRedirectUrl(
      samlConfig,
      authnRequest,
      relayState
    );

    // Store the pending request for validation
    this.pendingRequests.set(authnRequest.id, {
      requestId: authnRequest.id,
      idpId,
      createdAt: Date.now(),
      relayState,
    });

    // Cleanup old pending requests
    this.cleanupPendingRequests();

    return {
      redirectUrl,
      requestId: authnRequest.id,
      relayState,
    };
  }

  /**
   * Handle an SSO callback (Assertion Consumer Service endpoint).
   * @param samlResponseBase64 - Base64-encoded SAML response from POST binding
   * @param idpId - ID of the expected Identity Provider
   * @returns Callback processing result
   */
  handleCallback(
    samlResponseBase64: string,
    idpId: string
  ): SSOCallbackResult {
    const idp = this.idps.get(idpId);
    if (!idp) {
      return {
        success: false,
        user: null,
        response: this.createErrorResponse("IdP not configured"),
        error: `Identity Provider "${idpId}" is not configured`,
        idpId,
      };
    }

    const xml = decodePostResponse(samlResponseBase64);
    const samlResponse = parseSAMLResponse(xml);

    // Validate status
    if (
      samlResponse.statusCode !==
      "urn:oasis:names:tc:SAML:2.0:status:Success"
    ) {
      return {
        success: false,
        user: null,
        response: samlResponse,
        error: `SAML authentication failed: ${samlResponse.statusCode}`,
        idpId,
      };
    }

    // Validate assertion exists
    if (!samlResponse.assertion) {
      return {
        success: false,
        user: null,
        response: samlResponse,
        error: "SAML response does not contain an assertion",
        idpId,
      };
    }

    // Validate InResponseTo
    if (samlResponse.inResponseTo) {
      const pending = this.pendingRequests.get(samlResponse.inResponseTo);
      if (!pending) {
        return {
          success: false,
          user: null,
          response: samlResponse,
          error: "SAML response does not match a pending request",
          idpId,
        };
      }
      this.pendingRequests.delete(samlResponse.inResponseTo);
    }

    // Validate timing
    if (
      !validateAssertionTiming(
        samlResponse.assertion,
        this.clockSkewSec
      )
    ) {
      return {
        success: false,
        user: null,
        response: samlResponse,
        error: "SAML assertion has expired or is not yet valid",
        idpId,
      };
    }

    // Map assertion to user
    const user = mapAssertionToUser(
      samlResponse.assertion,
      this.attributeMapping
    );

    return {
      success: true,
      user,
      response: samlResponse,
      error: null,
      idpId,
    };
  }

  /**
   * Build a SAMLConfig from the SP and a specific IdP.
   * @param idp - Identity Provider configuration
   * @returns Complete SAML configuration
   */
  private buildSAMLConfig(idp: IdentityProvider): SAMLConfig {
    return {
      idp,
      sp: this.sp,
      clockSkewToleranceSec: this.clockSkewSec,
      maxAssertionAgeSec: this.maxAssertionAgeSec,
    };
  }

  /**
   * Clean up expired pending SSO requests.
   */
  private cleanupPendingRequests(): void {
    const now = Date.now();
    for (const [id, req] of this.pendingRequests) {
      if (now - req.createdAt > this.requestTtlMs) {
        this.pendingRequests.delete(id);
      }
    }
  }

  /**
   * Create an error SAMLResponse object for internal error handling.
   * @param message - Error message
   * @returns Minimal SAMLResponse with error status
   */
  private createErrorResponse(message: string): SAMLResponse {
    return {
      id: generateRequestId(),
      issuer: "internal",
      issueInstant: new Date(),
      statusCode: "urn:oasis:names:tc:SAML:2.0:status:Responder",
      statusMessage: message,
      signatureValid: false,
      rawXml: "",
    };
  }
}
