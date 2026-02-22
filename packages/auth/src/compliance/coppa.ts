/**
 * COPPA (Children's Online Privacy Protection Act) compliance utilities.
 * Provides age verification, parental consent management,
 * minor account restrictions, and data minimization enforcement.
 * @module compliance/coppa
 */

/**
 * Age verification result.
 */
export interface AgeVerificationResult {
  /** Whether the user is old enough to use the service without restrictions */
  isAdult: boolean;
  /** Whether the user is a minor (under COPPA age threshold) */
  isMinor: boolean;
  /** Whether parental consent is required */
  requiresParentalConsent: boolean;
  /** Whether the user is too young to use the service at all */
  isTooYoung: boolean;
  /** Calculated age in years */
  ageInYears: number;
  /** Age category for access control */
  ageCategory: "adult" | "teen" | "child" | "too_young";
}

/**
 * Parental consent record.
 */
export interface ParentalConsentRecord {
  /** Minor's user ID */
  minorUserId: string;
  /** Parent/guardian's email */
  parentEmail: string;
  /** Parent/guardian's verified identity */
  parentName: string;
  /** Whether consent has been verified */
  verified: boolean;
  /** Verification method used */
  verificationMethod: string | null;
  /** When consent was requested */
  requestedAt: number;
  /** When consent was granted */
  grantedAt: number | null;
  /** When consent expires (requires renewal) */
  expiresAt: number | null;
  /** Specific data collection consent details */
  consentScope: string[];
}

/**
 * Minor account restrictions configuration.
 */
export interface MinorAccountRestrictions {
  /** Whether the minor can have a public profile */
  allowPublicProfile: boolean;
  /** Whether the minor can send/receive messages */
  allowMessaging: boolean;
  /** Whether the minor can share location data */
  allowLocationSharing: boolean;
  /** Whether the minor's data can be used for advertising */
  allowAdvertising: boolean;
  /** Whether third-party sharing is allowed */
  allowThirdPartySharing: boolean;
  /** Maximum data fields that can be collected */
  allowedDataFields: string[];
  /** Whether real-time communications are allowed */
  allowRealTimeCommunication: boolean;
}

/**
 * Data minimization report for a minor's account.
 */
export interface DataMinimizationReport {
  /** User ID */
  userId: string;
  /** Fields currently collected */
  collectedFields: string[];
  /** Fields that should NOT be collected for minors */
  prohibitedFields: string[];
  /** Fields that are unnecessarily collected */
  excessiveFields: string[];
  /** Whether the account is compliant */
  compliant: boolean;
  /** Recommendations for compliance */
  recommendations: string[];
}

/**
 * COPPA compliance configuration.
 */
export interface CoppaConfig {
  /** Minimum age to use the service without parental consent (default: 13) */
  minAgeWithoutConsent?: number;
  /** Minimum age to use the service at all (default: 0, meaning any age with consent) */
  minimumAge?: number;
  /** Age at which users are considered adults (default: 18) */
  adultAge?: number;
  /** How often parental consent must be renewed in days (null for no renewal) */
  consentRenewalDays?: number | null;
  /** Data fields allowed for minor accounts */
  allowedMinorFields?: string[];
}

/**
 * Default COPPA configuration.
 */
const COPPA_DEFAULTS: Required<CoppaConfig> = {
  minAgeWithoutConsent: 13,
  minimumAge: 0,
  adultAge: 18,
  consentRenewalDays: 365,
  allowedMinorFields: [
    "username",
    "email",
    "displayName",
    "avatarUrl",
  ],
};

/**
 * Default restrictions for minor accounts.
 */
const DEFAULT_MINOR_RESTRICTIONS: MinorAccountRestrictions = {
  allowPublicProfile: false,
  allowMessaging: false,
  allowLocationSharing: false,
  allowAdvertising: false,
  allowThirdPartySharing: false,
  allowedDataFields: ["username", "email", "displayName"],
  allowRealTimeCommunication: false,
};

/**
 * COPPA compliance manager.
 */
export class CoppaManager {
  private readonly config: Required<CoppaConfig>;
  private readonly consentRecords = new Map<
    string,
    ParentalConsentRecord
  >();

  /**
   * Create a new COPPA compliance manager.
   * @param config - COPPA configuration
   */
  constructor(config: CoppaConfig = {}) {
    this.config = {
      minAgeWithoutConsent:
        config.minAgeWithoutConsent ?? COPPA_DEFAULTS.minAgeWithoutConsent,
      minimumAge: config.minimumAge ?? COPPA_DEFAULTS.minimumAge,
      adultAge: config.adultAge ?? COPPA_DEFAULTS.adultAge,
      consentRenewalDays:
        config.consentRenewalDays ?? COPPA_DEFAULTS.consentRenewalDays,
      allowedMinorFields:
        config.allowedMinorFields ?? COPPA_DEFAULTS.allowedMinorFields,
    };
  }

  /**
   * Calculate a user's age from their date of birth.
   * @param dateOfBirth - Date of birth
   * @param referenceDate - Reference date (default: now)
   * @returns Age in years
   */
  calculateAge(dateOfBirth: Date, referenceDate?: Date): number {
    const ref = referenceDate ?? new Date();
    let age = ref.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = ref.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && ref.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }
    return Math.max(0, age);
  }

  /**
   * Verify a user's age and determine their access category.
   * @param dateOfBirth - User's date of birth
   * @returns Age verification result
   */
  verifyAge(dateOfBirth: Date): AgeVerificationResult {
    const age = this.calculateAge(dateOfBirth);

    let ageCategory: AgeVerificationResult["ageCategory"];
    if (age >= this.config.adultAge) {
      ageCategory = "adult";
    } else if (age >= this.config.minAgeWithoutConsent) {
      ageCategory = "teen";
    } else if (age >= this.config.minimumAge) {
      ageCategory = "child";
    } else {
      ageCategory = "too_young";
    }

    const needsConsent =
      age < this.config.minAgeWithoutConsent &&
      age >= this.config.minimumAge;

    return {
      isAdult: age >= this.config.adultAge,
      isMinor: age < this.config.minAgeWithoutConsent,
      requiresParentalConsent: needsConsent,
      isTooYoung: age < this.config.minimumAge,
      ageInYears: age,
      ageCategory,
    };
  }

  /**
   * Request parental consent for a minor user.
   * @param minorUserId - Minor's user ID
   * @param parentEmail - Parent/guardian's email address
   * @param consentScope - Specific data collection purposes
   * @returns The consent record (pending verification)
   */
  requestParentalConsent(
    minorUserId: string,
    parentEmail: string,
    consentScope: string[]
  ): ParentalConsentRecord {
    const now = Date.now();

    const record: ParentalConsentRecord = {
      minorUserId,
      parentEmail,
      parentName: "",
      verified: false,
      verificationMethod: null,
      requestedAt: now,
      grantedAt: null,
      expiresAt: null,
      consentScope,
    };

    this.consentRecords.set(minorUserId, record);
    return record;
  }

  /**
   * Grant parental consent after verification.
   * @param minorUserId - Minor's user ID
   * @param parentName - Verified parent/guardian name
   * @param verificationMethod - How the parent was verified
   * @returns Updated consent record or null if not found
   */
  grantConsent(
    minorUserId: string,
    parentName: string,
    verificationMethod: string
  ): ParentalConsentRecord | null {
    const record = this.consentRecords.get(minorUserId);
    if (!record) {
      return null;
    }

    const now = Date.now();
    record.verified = true;
    record.parentName = parentName;
    record.verificationMethod = verificationMethod;
    record.grantedAt = now;
    record.expiresAt =
      this.config.consentRenewalDays !== null
        ? now + this.config.consentRenewalDays * 24 * 60 * 60 * 1000
        : null;

    return record;
  }

  /**
   * Check if a minor has valid parental consent.
   * @param minorUserId - Minor's user ID
   * @returns True if consent is granted and not expired
   */
  hasValidConsent(minorUserId: string): boolean {
    const record = this.consentRecords.get(minorUserId);
    if (!record || !record.verified || !record.grantedAt) {
      return false;
    }

    if (record.expiresAt !== null && Date.now() > record.expiresAt) {
      return false;
    }

    return true;
  }

  /**
   * Revoke parental consent for a minor.
   * @param minorUserId - Minor's user ID
   * @returns True if consent was found and revoked
   */
  revokeConsent(minorUserId: string): boolean {
    return this.consentRecords.delete(minorUserId);
  }

  /**
   * Get account restrictions for a minor.
   * @returns Minor account restrictions
   */
  getMinorRestrictions(): MinorAccountRestrictions {
    return {
      ...DEFAULT_MINOR_RESTRICTIONS,
      allowedDataFields: [...this.config.allowedMinorFields],
    };
  }

  /**
   * Audit a minor's data for minimization compliance.
   * @param userId - User ID
   * @param collectedFields - Fields currently collected for the user
   * @returns Data minimization report
   */
  auditDataMinimization(
    userId: string,
    collectedFields: string[]
  ): DataMinimizationReport {
    const allowed = this.config.allowedMinorFields;
    const prohibited = [
      "location",
      "phoneNumber",
      "socialSecurityNumber",
      "financialInfo",
      "biometricData",
      "preciseGeolocation",
    ];

    const excessiveFields = collectedFields.filter(
      (field) => !allowed.includes(field)
    );

    const prohibitedCollected = collectedFields.filter((field) =>
      prohibited.includes(field)
    );

    const recommendations: string[] = [];
    if (excessiveFields.length > 0) {
      recommendations.push(
        `Remove unnecessary data fields: ${excessiveFields.join(", ")}`
      );
    }
    if (prohibitedCollected.length > 0) {
      recommendations.push(
        `Immediately delete prohibited data: ${prohibitedCollected.join(", ")}`
      );
    }

    return {
      userId,
      collectedFields,
      prohibitedFields: prohibitedCollected,
      excessiveFields,
      compliant:
        excessiveFields.length === 0 && prohibitedCollected.length === 0,
      recommendations,
    };
  }

  /**
   * Get the consent record for a minor.
   * @param minorUserId - Minor's user ID
   * @returns Consent record or undefined
   */
  getConsentRecord(
    minorUserId: string
  ): ParentalConsentRecord | undefined {
    return this.consentRecords.get(minorUserId);
  }
}
