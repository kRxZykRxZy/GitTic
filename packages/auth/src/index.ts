export { generateToken, verifyToken, decodeToken } from "./jwt.js";
export type { JwtPayload } from "./jwt.js";
export { hashPassword, comparePassword } from "./password.js";
export { hasRole, hasPermission, getPermissions } from "./roles.js";
export type { Permission } from "./roles.js";

// OAuth
export { OAuthError } from "./oauth/oauth-types.js";
export type {
  OAuthProviderName,
  OAuthConfig,
  OAuthToken,
  OAuthProfile,
  OAuthState,
  OAuthCallbackResult,
  OAuthProvider,
} from "./oauth/oauth-types.js";
export {
  createGitHubConfig,
  buildGitHubAuthUrl,
  exchangeGitHubCode,
  fetchGitHubProfile,
  GitHubOAuthProvider,
} from "./oauth/github.js";
export {
  createGoogleConfig,
  buildGoogleAuthUrl,
  exchangeGoogleCode,
  refreshGoogleToken,
  fetchGoogleProfile,
  GoogleOAuthProvider,
} from "./oauth/google.js";
export {
  createGitLabConfig,
  buildGitLabAuthUrl,
  exchangeGitLabCode,
  refreshGitLabToken,
  fetchGitLabProfile,
  GitLabOAuthProvider,
} from "./oauth/gitlab.js";
export {
  createBitbucketConfig,
  buildBitbucketAuthUrl,
  exchangeBitbucketCode,
  refreshBitbucketToken,
  fetchBitbucketProfile,
  BitbucketOAuthProvider,
} from "./oauth/bitbucket.js";
export { OAuthManager } from "./oauth/oauth-manager.js";
export type {
  OAuthManagerConfig,
  OAuthFlowInitiation,
} from "./oauth/oauth-manager.js";
export {
  generateNonce,
  signState,
  verifyStateSignature,
  createOAuthState,
  validateOAuthState,
  cleanupExpiredStates,
  getPendingStateCount,
  clearAllStates,
} from "./oauth/oauth-state.js";
export type { OAuthStateConfig } from "./oauth/oauth-state.js";

// MFA
export {
  encodeBase32,
  decodeBase32,
  generateTOTPSecret,
  computeHOTP,
  computeTOTP,
  verifyTOTP,
  generateOTPAuthURI,
} from "./mfa/totp.js";
export type {
  TOTPConfig,
  TOTPSecret,
  TOTPVerificationResult,
} from "./mfa/totp.js";
export {
  hashBackupCode,
  formatBackupCode,
  generateBackupCodes,
  validateBackupCode,
  getRemainingCodeCount,
  shouldWarnLowCodes,
  allCodesConsumed,
  getBackupCodeStats,
} from "./mfa/backup-codes.js";
export type {
  BackupCodeEntry,
  BackupCodeGenerationResult,
  BackupCodeConfig,
} from "./mfa/backup-codes.js";
export {
  createEmptyEnrollment,
  MFAManager,
} from "./mfa/mfa-manager.js";
export type {
  MFAMethod,
  MFAEnrollment,
  MFAEnableResult,
  MFAVerifyResult,
  MFAManagerConfig,
} from "./mfa/mfa-manager.js";

// SSO
export { DEFAULT_ATTRIBUTE_MAPPING } from "./sso/saml-types.js";
export type {
  SAMLNameIDFormat,
  SAMLBinding,
  SAMLAuthnContext,
  IdentityProvider,
  ServiceProvider,
  SAMLConfig,
  SAMLAttribute,
  SAMLSubject,
  SAMLConditions,
  SAMLAssertion,
  SAMLStatusCode,
  SAMLResponse,
  SAMLAuthnRequest,
  SAMLMappedUser,
  SAMLAttributeMapping,
} from "./sso/saml-types.js";
export {
  generateRequestId,
  buildAuthnRequest,
  serializeAuthnRequest,
  encodeAuthnRequestForRedirect,
  buildRedirectUrl,
  escapeXml,
  decodePostResponse,
  parseSAMLResponse,
  validateAssertionTiming,
  mapAssertionToUser,
  getCertificateFingerprint,
} from "./sso/saml-handler.js";
export { SSOManager } from "./sso/sso-manager.js";
export type {
  SSOLoginResult,
  SSOCallbackResult,
  SSOManagerConfig,
} from "./sso/sso-manager.js";

// Tokens
export {
  hashApiToken,
  generateApiTokenString,
  createApiToken,
  validateApiToken,
  tokenHasScope,
  tokenHasAllScopes,
  revokeApiToken,
  listActiveTokens,
  revokeAllUserTokens,
  isValidApiTokenFormat,
} from "./tokens/api-token.js";
export type {
  ApiTokenScope,
  ApiTokenRecord,
  ApiTokenCreateResult,
  CreateApiTokenOptions,
} from "./tokens/api-token.js";
export {
  hashRefreshToken,
  generateFamilyId,
  generateRefreshToken,
  rotateRefreshToken,
  revokeFamilyTokens,
  revokeUserRefreshTokens,
  cleanupExpiredRefreshTokens,
  getActiveTokenFamilies,
} from "./tokens/refresh-token.js";
export type {
  RefreshTokenRecord,
  RefreshTokenResult,
  RefreshTokenRotationResult,
  RefreshTokenConfig,
} from "./tokens/refresh-token.js";
export { InMemoryTokenStore } from "./tokens/token-store.js";
export type {
  StoredToken,
  TokenQueryOptions,
  TokenStore,
} from "./tokens/token-store.js";

// Session
export { SessionManager } from "./session/session-manager.js";
export type {
  SessionRecord,
  CreateSessionResult,
  SessionManagerConfig,
} from "./session/session-manager.js";
export {
  parseUserAgent,
  generateDeviceId,
  DeviceTracker,
} from "./session/device-tracker.js";
export type {
  DeviceInfo,
  KnownDevice,
  LoginAssessment,
} from "./session/device-tracker.js";
export { IpSecurityManager } from "./session/ip-security.js";
export type {
  IpListEntry,
  IpRateLimitRecord,
  SuspiciousIpRecord,
  GeoLocation,
  IpSecurityCheck,
  IpSecurityConfig,
} from "./session/ip-security.js";

// Middleware
export {
  extractToken,
  verifyAuthToken,
  createAuthMiddleware,
  requireRole,
  requirePermission,
  requireAnyRole,
} from "./middleware/auth-middleware.js";
export type {
  AuthUser,
  AuthRequest,
  AuthResponse,
  NextFunction,
  AuthMiddlewareConfig,
} from "./middleware/auth-middleware.js";
export { AuthRateLimiter } from "./middleware/rate-limit-middleware.js";
export type {
  RateLimitAction,
  RateLimitRule,
  RateLimitResult,
  RateLimitConfig,
} from "./middleware/rate-limit-middleware.js";
export {
  generateCsrfToken,
  validateCsrfToken,
  extractCsrfTokenFromRequest,
  isPathExcluded,
  createCsrfMiddleware,
} from "./middleware/csrf-middleware.js";
export type {
  CsrfConfig,
  CsrfToken,
  CsrfRequest,
  CsrfResponse,
  CsrfNextFunction,
} from "./middleware/csrf-middleware.js";

// Compliance
export { GdprManager } from "./compliance/gdpr.js";
export type {
  ConsentType,
  ConsentRecord,
  RetentionPolicy,
  GdprDataExport,
  DeletionResult,
} from "./compliance/gdpr.js";
export { CoppaManager } from "./compliance/coppa.js";
export type {
  AgeVerificationResult,
  ParentalConsentRecord,
  MinorAccountRestrictions,
  DataMinimizationReport,
  CoppaConfig,
} from "./compliance/coppa.js";
export { TermsTracker } from "./compliance/terms-tracker.js";
export type {
  TermsDocument,
  TermsDocumentType,
  TermsAcceptance,
  TermsAcceptanceStatus,
  TermsTrackerConfig,
} from "./compliance/terms-tracker.js";

// Admin
export {
  InMemoryUserCountProvider,
  FirstUserAdmin,
} from "./admin/first-user-admin.js";
export type {
  UserCountProvider,
  FirstUserAdminConfig,
  RoleDetermination,
} from "./admin/first-user-admin.js";
export { UserManagement } from "./admin/user-management.js";
export type {
  ManagedUser,
  UserSearchFilters,
  PaginatedResult,
  BulkOperationResult,
} from "./admin/user-management.js";
export { AuditLogger } from "./admin/audit-logger.js";
export type {
  AuditEventType,
  AuditSeverity,
  AuditEntry,
  AuditQueryOptions,
  AuditStats,
} from "./admin/audit-logger.js";

// Security
export { KeyRotationManager } from "./security/key-rotation.js";
export type {
  SigningKey,
  KeyRotationConfig,
} from "./security/key-rotation.js";
export { PasswordPolicy } from "./security/password-policy.js";
export type {
  PasswordComplexityRules,
  PasswordValidationResult,
  PasswordHistoryEntry,
  PasswordPolicyConfig,
} from "./security/password-policy.js";
export { haversineDistance, LoginDetector } from "./security/login-detector.js";
export type {
  LoginEvent,
  SuspicionAlert,
  SuspicionType,
  LoginDetectorConfig,
} from "./security/login-detector.js";
