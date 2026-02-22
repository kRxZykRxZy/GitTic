/**
 * SAML request/response handling.
 * Builds SAML AuthnRequests, parses responses, and validates assertions.
 * Uses only built-in Node.js modules (no external SAML library).
 * @module sso/saml-handler
 */

import { randomBytes, createHash } from "node:crypto";
import type {
  SAMLConfig,
  SAMLAuthnRequest,
  SAMLAssertion,
  SAMLResponse,
  SAMLAttribute,
  SAMLSubject,
  SAMLConditions,
  SAMLMappedUser,
  SAMLAttributeMapping,
  SAMLStatusCode,
} from "./saml-types.js";
import { DEFAULT_ATTRIBUTE_MAPPING } from "./saml-types.js";

/**
 * Generate a unique SAML request ID.
 * @returns A unique ID prefixed with underscore (SAML convention)
 */
export function generateRequestId(): string {
  return `_${randomBytes(16).toString("hex")}`;
}

/**
 * Build a SAML AuthnRequest data structure.
 * @param config - SAML configuration
 * @param options - Optional overrides for the request
 * @returns AuthnRequest data object
 */
export function buildAuthnRequest(
  config: SAMLConfig,
  options?: { forceAuthn?: boolean; isPassive?: boolean }
): SAMLAuthnRequest {
  return {
    id: generateRequestId(),
    issueInstant: new Date(),
    issuer: config.sp.entityId,
    destination: config.idp.ssoUrl,
    assertionConsumerServiceUrl: config.sp.acsUrl,
    nameIdFormat: config.sp.nameIdFormat,
    protocolBinding: config.idp.responseBinding,
    forceAuthn: options?.forceAuthn ?? false,
    isPassive: options?.isPassive ?? false,
    authnContext: undefined,
  };
}

/**
 * Serialize an AuthnRequest to XML string.
 * @param request - The AuthnRequest data
 * @returns XML string representation
 */
export function serializeAuthnRequest(request: SAMLAuthnRequest): string {
  const lines = [
    `<samlp:AuthnRequest`,
    `  xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"`,
    `  xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"`,
    `  ID="${escapeXml(request.id)}"`,
    `  Version="2.0"`,
    `  IssueInstant="${request.issueInstant.toISOString()}"`,
    `  Destination="${escapeXml(request.destination)}"`,
    `  AssertionConsumerServiceURL="${escapeXml(request.assertionConsumerServiceUrl)}"`,
    `  ProtocolBinding="${escapeXml(request.protocolBinding)}"`,
  ];

  if (request.forceAuthn) {
    lines.push(`  ForceAuthn="true"`);
  }
  if (request.isPassive) {
    lines.push(`  IsPassive="true"`);
  }

  lines.push(`>`);
  lines.push(`  <saml:Issuer>${escapeXml(request.issuer)}</saml:Issuer>`);

  lines.push(`  <samlp:NameIDPolicy`);
  lines.push(`    Format="${escapeXml(request.nameIdFormat)}"`);
  lines.push(`    AllowCreate="true" />`);

  lines.push(`</samlp:AuthnRequest>`);

  return lines.join("\n");
}

/**
 * Encode an AuthnRequest XML for HTTP-Redirect binding.
 * @param xml - AuthnRequest XML string
 * @returns Base64-encoded, deflated XML for use as query parameter
 */
export function encodeAuthnRequestForRedirect(xml: string): string {
  // Simple base64 encoding (real implementation would use DEFLATE)
  return Buffer.from(xml, "utf-8").toString("base64");
}

/**
 * Build the full SSO redirect URL with the encoded AuthnRequest.
 * @param config - SAML configuration
 * @param request - The AuthnRequest data
 * @param relayState - Optional relay state for maintaining application state
 * @returns Full redirect URL
 */
export function buildRedirectUrl(
  config: SAMLConfig,
  request: SAMLAuthnRequest,
  relayState?: string
): string {
  const xml = serializeAuthnRequest(request);
  const encoded = encodeAuthnRequestForRedirect(xml);

  const params = new URLSearchParams({
    SAMLRequest: encoded,
  });

  if (relayState) {
    params.set("RelayState", relayState);
  }

  const separator = config.idp.ssoUrl.includes("?") ? "&" : "?";
  return `${config.idp.ssoUrl}${separator}${params.toString()}`;
}

/**
 * Escape special XML characters in a string.
 * @param str - String to escape
 * @returns Escaped string safe for XML attributes/content
 */
export function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Decode a base64-encoded SAML response from a POST binding.
 * @param base64Response - Base64-encoded SAML response
 * @returns Decoded XML string
 */
export function decodePostResponse(base64Response: string): string {
  return Buffer.from(base64Response, "base64").toString("utf-8");
}

/**
 * Extract a simple text value from XML by tag name (basic parser).
 * @param xml - XML string
 * @param tagName - Tag name to search for
 * @returns Text content or null
 */
function extractXmlValue(xml: string, tagName: string): string | null {
  const patterns = [
    new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`, "i"),
    new RegExp(`<[^:]+:${tagName}[^>]*>([^<]*)</[^:]+:${tagName}>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = xml.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Extract an XML attribute value.
 * @param xml - XML string
 * @param elementTag - Element tag to search within
 * @param attrName - Attribute name
 * @returns Attribute value or null
 */
function extractXmlAttribute(
  xml: string,
  elementTag: string,
  attrName: string
): string | null {
  const elementPattern = new RegExp(
    `<(?:[^:]+:)?${elementTag}[^>]*${attrName}="([^"]*)"`,
    "i"
  );
  const match = xml.match(elementPattern);
  return match ? match[1] : null;
}

/**
 * Parse a SAML response XML into a structured SAMLResponse object.
 * This is a simplified parser for demonstration purposes.
 * @param xml - Raw SAML response XML
 * @returns Parsed SAMLResponse
 */
export function parseSAMLResponse(xml: string): SAMLResponse {
  const responseId =
    extractXmlAttribute(xml, "Response", "ID") ?? generateRequestId();
  const inResponseTo = extractXmlAttribute(xml, "Response", "InResponseTo");
  const issuer = extractXmlValue(xml, "Issuer") ?? "unknown";
  const issueInstantStr = extractXmlAttribute(
    xml,
    "Response",
    "IssueInstant"
  );
  const destination = extractXmlAttribute(xml, "Response", "Destination");
  const statusCodeValue =
    extractXmlAttribute(xml, "StatusCode", "Value") ?? "";

  const statusCode = statusCodeValue.includes("Success")
    ? "urn:oasis:names:tc:SAML:2.0:status:Success"
    : statusCodeValue.includes("Requester")
      ? "urn:oasis:names:tc:SAML:2.0:status:Requester"
      : statusCodeValue.includes("Responder")
        ? "urn:oasis:names:tc:SAML:2.0:status:Responder"
        : ("urn:oasis:names:tc:SAML:2.0:status:VersionMismatch" as SAMLStatusCode);

  const assertion = parseAssertionFromXml(xml);

  return {
    id: responseId,
    inResponseTo: inResponseTo ?? undefined,
    issuer,
    issueInstant: issueInstantStr
      ? new Date(issueInstantStr)
      : new Date(),
    destination: destination ?? undefined,
    statusCode,
    assertion: assertion ?? undefined,
    signatureValid: false,
    rawXml: xml,
  };
}

/**
 * Parse a SAML assertion from within a response XML.
 * @param xml - Full SAML response XML
 * @returns Parsed SAMLAssertion or null
 */
function parseAssertionFromXml(xml: string): SAMLAssertion | null {
  if (!xml.includes("Assertion")) {
    return null;
  }

  const assertionId =
    extractXmlAttribute(xml, "Assertion", "ID") ?? generateRequestId();
  const issuer = extractXmlValue(xml, "Issuer") ?? "unknown";
  const issueInstantStr = extractXmlAttribute(
    xml,
    "Assertion",
    "IssueInstant"
  );

  const nameId = extractXmlValue(xml, "NameID") ?? "";

  const subject: SAMLSubject = {
    nameId,
    nameIdFormat:
      "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
  };

  const conditions: SAMLConditions = {
    audienceRestrictions: [],
  };

  const attributes = parseAttributesFromXml(xml);

  return {
    id: assertionId,
    issuer,
    issueInstant: issueInstantStr
      ? new Date(issueInstantStr)
      : new Date(),
    subject,
    conditions,
    attributes,
    signatureValid: false,
  };
}

/**
 * Parse SAML attributes from the AttributeStatement.
 * @param xml - XML containing attribute statements
 * @returns Array of parsed SAML attributes
 */
function parseAttributesFromXml(xml: string): SAMLAttribute[] {
  const attributes: SAMLAttribute[] = [];
  const attrPattern =
    /Name="([^"]*)"[^>]*>[\s\S]*?<[^:]*:?AttributeValue[^>]*>([^<]*)</g;
  let match: RegExpExecArray | null;

  while ((match = attrPattern.exec(xml)) !== null) {
    const existingAttr = attributes.find((a) => a.name === match![1]);
    if (existingAttr) {
      existingAttr.values.push(match[2].trim());
    } else {
      attributes.push({
        name: match[1],
        values: [match[2].trim()],
      });
    }
  }

  return attributes;
}

/**
 * Validate SAML assertion timing conditions.
 * @param assertion - The parsed assertion
 * @param clockSkewSec - Allowed clock skew in seconds
 * @returns True if the assertion is within valid time bounds
 */
export function validateAssertionTiming(
  assertion: SAMLAssertion,
  clockSkewSec: number = 300
): boolean {
  const now = Date.now();
  const skewMs = clockSkewSec * 1000;

  if (assertion.conditions.notBefore) {
    if (now < assertion.conditions.notBefore.getTime() - skewMs) {
      return false;
    }
  }

  if (assertion.conditions.notOnOrAfter) {
    if (now >= assertion.conditions.notOnOrAfter.getTime() + skewMs) {
      return false;
    }
  }

  return true;
}

/**
 * Map SAML assertion attributes to a user object.
 * @param assertion - The parsed SAML assertion
 * @param mapping - Attribute mapping configuration
 * @returns Mapped user data
 */
export function mapAssertionToUser(
  assertion: SAMLAssertion,
  mapping: SAMLAttributeMapping = DEFAULT_ATTRIBUTE_MAPPING
): SAMLMappedUser {
  const getAttrValue = (name: string): string | null => {
    const attr = assertion.attributes.find((a) => a.name === name);
    return attr?.values[0] ?? null;
  };

  const getAttrValues = (name: string): string[] => {
    const attr = assertion.attributes.find((a) => a.name === name);
    return attr?.values ?? [];
  };

  const allAttrs: Record<string, string[]> = {};
  for (const attr of assertion.attributes) {
    allAttrs[attr.name] = attr.values;
  }

  return {
    nameId: assertion.subject.nameId,
    email: getAttrValue(mapping.email),
    firstName: getAttrValue(mapping.firstName),
    lastName: getAttrValue(mapping.lastName),
    displayName: getAttrValue(mapping.displayName),
    groups: getAttrValues(mapping.groups),
    attributes: allAttrs,
  };
}

/**
 * Generate a SHA-256 fingerprint of a certificate.
 * @param certificate - PEM-encoded certificate
 * @returns Colon-separated hex fingerprint
 */
export function getCertificateFingerprint(certificate: string): string {
  const stripped = certificate
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s/g, "");

  const der = Buffer.from(stripped, "base64");
  const hash = createHash("sha256").update(der).digest("hex");

  const hexPairs = hash.toUpperCase().match(/.{2}/g);

  return hexPairs ? hexPairs.join(":") : hash.toUpperCase();
}
