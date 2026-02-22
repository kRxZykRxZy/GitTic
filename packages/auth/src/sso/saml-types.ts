/**
 * SAML SSO type definitions.
 * Defines interfaces for SAML 2.0 Single Sign-On configuration,
 * assertions, responses, and provider metadata.
 * @module sso/saml-types
 */

/**
 * SAML name ID format options.
 */
export type SAMLNameIDFormat =
  | "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress"
  | "urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified"
  | "urn:oasis:names:tc:SAML:2.0:nameid-format:persistent"
  | "urn:oasis:names:tc:SAML:2.0:nameid-format:transient";

/**
 * SAML binding types for request/response transport.
 */
export type SAMLBinding =
  | "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"
  | "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST";

/**
 * SAML authentication context class references.
 */
export type SAMLAuthnContext =
  | "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"
  | "urn:oasis:names:tc:SAML:2.0:ac:classes:Password"
  | "urn:oasis:names:tc:SAML:2.0:ac:classes:X509"
  | "urn:oasis:names:tc:SAML:2.0:ac:classes:unspecified";

/**
 * Identity Provider (IdP) configuration.
 */
export interface IdentityProvider {
  /** Unique identifier for this IdP */
  id: string;
  /** Human-readable name */
  name: string;
  /** IdP entity ID (issuer) */
  entityId: string;
  /** SSO login URL */
  ssoUrl: string;
  /** Optional SSO logout URL */
  sloUrl?: string;
  /** IdP's X.509 signing certificate (PEM format) */
  certificate: string;
  /** Preferred binding for AuthnRequest */
  requestBinding: SAMLBinding;
  /** Preferred binding for Response */
  responseBinding: SAMLBinding;
  /** Expected NameID format */
  nameIdFormat: SAMLNameIDFormat;
  /** Whether to sign AuthnRequests */
  wantAuthnRequestsSigned: boolean;
  /** Whether to validate response signatures */
  wantAssertionsSigned: boolean;
  /** Metadata URL (if available for auto-configuration) */
  metadataUrl?: string;
}

/**
 * Service Provider (SP) configuration — our application.
 */
export interface ServiceProvider {
  /** SP entity ID (our application's identifier) */
  entityId: string;
  /** Assertion Consumer Service URL (our callback endpoint) */
  acsUrl: string;
  /** Optional Single Logout URL */
  sloUrl?: string;
  /** SP's X.509 signing certificate (PEM format) */
  certificate?: string;
  /** SP's private key for signing/decrypting (PEM format) */
  privateKey?: string;
  /** Whether to sign AuthnRequests */
  signRequests: boolean;
  /** Whether we require signed assertions */
  requireSignedAssertions: boolean;
  /** Our preferred NameID format */
  nameIdFormat: SAMLNameIDFormat;
}

/**
 * Full SAML configuration combining IdP and SP settings.
 */
export interface SAMLConfig {
  /** Identity Provider configuration */
  idp: IdentityProvider;
  /** Service Provider configuration */
  sp: ServiceProvider;
  /** Clock skew tolerance in seconds for assertion validation */
  clockSkewToleranceSec: number;
  /** Maximum age of an assertion in seconds */
  maxAssertionAgeSec: number;
  /** Audience restriction to validate */
  audience?: string;
}

/**
 * SAML attribute from an assertion.
 */
export interface SAMLAttribute {
  /** Attribute name */
  name: string;
  /** Attribute friendly name (if provided) */
  friendlyName?: string;
  /** Attribute name format */
  nameFormat?: string;
  /** Attribute values (may be multi-valued) */
  values: string[];
}

/**
 * A SAML subject extracted from an assertion.
 */
export interface SAMLSubject {
  /** Subject NameID value */
  nameId: string;
  /** NameID format used */
  nameIdFormat: SAMLNameIDFormat;
  /** Subject confirmation method */
  confirmationMethod?: string;
  /** NotOnOrAfter for subject confirmation */
  notOnOrAfter?: Date;
  /** InResponseTo from the SubjectConfirmationData */
  inResponseTo?: string;
  /** Recipient URL from SubjectConfirmationData */
  recipient?: string;
}

/**
 * Conditions from a SAML assertion.
 */
export interface SAMLConditions {
  /** Not valid before this time */
  notBefore?: Date;
  /** Not valid on or after this time */
  notOnOrAfter?: Date;
  /** Audience restrictions */
  audienceRestrictions: string[];
}

/**
 * Parsed SAML assertion.
 */
export interface SAMLAssertion {
  /** Assertion ID */
  id: string;
  /** Issuer entity ID */
  issuer: string;
  /** Issue instant */
  issueInstant: Date;
  /** Subject information */
  subject: SAMLSubject;
  /** Assertion conditions */
  conditions: SAMLConditions;
  /** Authentication context class reference */
  authnContext?: SAMLAuthnContext;
  /** Authentication instant */
  authnInstant?: Date;
  /** Session index */
  sessionIndex?: string;
  /** Attributes from the AttributeStatement */
  attributes: SAMLAttribute[];
  /** Whether the assertion signature was valid */
  signatureValid: boolean;
}

/**
 * SAML response status codes.
 */
export type SAMLStatusCode =
  | "urn:oasis:names:tc:SAML:2.0:status:Success"
  | "urn:oasis:names:tc:SAML:2.0:status:Requester"
  | "urn:oasis:names:tc:SAML:2.0:status:Responder"
  | "urn:oasis:names:tc:SAML:2.0:status:VersionMismatch";

/**
 * Parsed SAML response.
 */
export interface SAMLResponse {
  /** Response ID */
  id: string;
  /** InResponseTo - the original AuthnRequest ID */
  inResponseTo?: string;
  /** Response issuer */
  issuer: string;
  /** Issue instant */
  issueInstant: Date;
  /** Response destination URL */
  destination?: string;
  /** Top-level status code */
  statusCode: SAMLStatusCode;
  /** Optional status message */
  statusMessage?: string;
  /** Parsed assertion (if status is Success) */
  assertion?: SAMLAssertion;
  /** Whether the response signature was valid */
  signatureValid: boolean;
  /** Raw XML for debugging */
  rawXml: string;
}

/**
 * SAML AuthnRequest data before XML serialization.
 */
export interface SAMLAuthnRequest {
  /** Request ID */
  id: string;
  /** Issue instant */
  issueInstant: Date;
  /** SP entity ID (issuer) */
  issuer: string;
  /** IdP SSO URL (destination) */
  destination: string;
  /** ACS URL (where to send the response) */
  assertionConsumerServiceUrl: string;
  /** Requested NameID format */
  nameIdFormat: SAMLNameIDFormat;
  /** Binding for the request */
  protocolBinding: SAMLBinding;
  /** Whether ForceAuthn is requested */
  forceAuthn: boolean;
  /** Whether IsPassive is requested */
  isPassive: boolean;
  /** Requested authentication context */
  authnContext?: SAMLAuthnContext;
}

/**
 * Mapped user attributes from a SAML assertion.
 */
export interface SAMLMappedUser {
  /** Unique identifier from the IdP */
  nameId: string;
  /** Email address */
  email: string | null;
  /** First name */
  firstName: string | null;
  /** Last name */
  lastName: string | null;
  /** Display name */
  displayName: string | null;
  /** Groups or roles from the IdP */
  groups: string[];
  /** All raw attributes */
  attributes: Record<string, string[]>;
}

/**
 * Attribute mapping configuration for translating IdP attributes to user fields.
 */
export interface SAMLAttributeMapping {
  /** IdP attribute name for email */
  email: string;
  /** IdP attribute name for first name */
  firstName: string;
  /** IdP attribute name for last name */
  lastName: string;
  /** IdP attribute name for display name */
  displayName: string;
  /** IdP attribute name for groups */
  groups: string;
}

/**
 * Default SAML attribute mapping for common IdP conventions.
 */
export const DEFAULT_ATTRIBUTE_MAPPING: SAMLAttributeMapping = {
  email:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  firstName:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
  lastName:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
  displayName:
    "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name",
  groups:
    "http://schemas.xmlsoap.org/claims/Group",
};
