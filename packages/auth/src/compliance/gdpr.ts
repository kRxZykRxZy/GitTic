/**
 * GDPR compliance utilities for authentication.
 * Provides user data export, account deletion, consent tracking,
 * data retention enforcement, and right to be forgotten implementation.
 * @module compliance/gdpr
 */

/**
 * Types of consent that users can grant or revoke.
 */
export type ConsentType =
  | "terms_of_service"
  | "privacy_policy"
  | "marketing_emails"
  | "analytics_tracking"
  | "third_party_sharing"
  | "cookie_usage";

/**
 * A consent record tracking a user's consent decision.
 */
export interface ConsentRecord {
  /** User ID */
  userId: string;
  /** Type of consent */
  consentType: ConsentType;
  /** Whether consent was granted */
  granted: boolean;
  /** When the consent decision was made */
  timestamp: number;
  /** IP address when consent was given/revoked */
  ipAddress: string;
  /** Version of the document consented to */
  documentVersion: string;
  /** Method of obtaining consent (e.g., "checkbox", "dialog") */
  method: string;
}

/**
 * Data retention policy for a specific data category.
 */
export interface RetentionPolicy {
  /** Data category */
  category: string;
  /** Retention period in days (null for indefinite) */
  retentionDays: number | null;
  /** Whether deletion is automatic or requires approval */
  autoDelete: boolean;
  /** Legal basis for retention */
  legalBasis: string;
}

/**
 * User data export structure for GDPR data portability.
 */
export interface GdprDataExport {
  /** Export metadata */
  exportInfo: {
    userId: string;
    exportedAt: string;
    format: string;
    version: string;
  };
  /** User profile data */
  profile: Record<string, unknown>;
  /** Consent history */
  consents: ConsentRecord[];
  /** Login history */
  loginHistory: Array<{
    timestamp: number;
    ipAddress: string;
    userAgent: string;
    success: boolean;
  }>;
  /** Additional data categories */
  additionalData: Record<string, unknown>;
}

/**
 * Result of a data deletion request.
 */
export interface DeletionResult {
  /** Whether the deletion was successful */
  success: boolean;
  /** Categories of data deleted */
  deletedCategories: string[];
  /** Categories retained (with reasons) */
  retainedCategories: Array<{
    category: string;
    reason: string;
    retainedUntil: number | null;
  }>;
  /** Timestamp of deletion */
  deletedAt: number;
  /** Anonymized user ID for audit purposes */
  anonymizedId: string;
}

/**
 * GDPR compliance manager for handling data privacy operations.
 */
export class GdprManager {
  private readonly consents = new Map<string, ConsentRecord[]>();
  private readonly retentionPolicies = new Map<string, RetentionPolicy>();
  private readonly deletionLog = new Map<string, DeletionResult>();

  /**
   * Create a new GDPR compliance manager with default retention policies.
   */
  constructor() {
    this.initDefaultPolicies();
  }

  /**
   * Initialize default data retention policies.
   */
  private initDefaultPolicies(): void {
    const defaults: RetentionPolicy[] = [
      {
        category: "profile",
        retentionDays: null,
        autoDelete: false,
        legalBasis: "Contract performance",
      },
      {
        category: "login_history",
        retentionDays: 90,
        autoDelete: true,
        legalBasis: "Legitimate interest (security)",
      },
      {
        category: "audit_logs",
        retentionDays: 365,
        autoDelete: true,
        legalBasis: "Legal obligation",
      },
      {
        category: "consent_records",
        retentionDays: 365 * 5,
        autoDelete: false,
        legalBasis: "Legal obligation (proof of consent)",
      },
      {
        category: "analytics",
        retentionDays: 30,
        autoDelete: true,
        legalBasis: "Consent",
      },
    ];

    for (const policy of defaults) {
      this.retentionPolicies.set(policy.category, policy);
    }
  }

  /**
   * Record a user's consent decision.
   * @param userId - User ID
   * @param consentType - Type of consent
   * @param granted - Whether consent is granted
   * @param ipAddress - IP address of the user
   * @param documentVersion - Version of the consent document
   * @param method - Method used to obtain consent
   */
  recordConsent(
    userId: string,
    consentType: ConsentType,
    granted: boolean,
    ipAddress: string,
    documentVersion: string,
    method: string = "checkbox"
  ): void {
    const record: ConsentRecord = {
      userId,
      consentType,
      granted,
      timestamp: Date.now(),
      ipAddress,
      documentVersion,
      method,
    };

    let userConsents = this.consents.get(userId);
    if (!userConsents) {
      userConsents = [];
      this.consents.set(userId, userConsents);
    }
    userConsents.push(record);
  }

  /**
   * Check if a user has granted a specific consent.
   * @param userId - User ID
   * @param consentType - Type of consent to check
   * @returns True if the most recent record for this consent type is granted
   */
  hasConsent(userId: string, consentType: ConsentType): boolean {
    const userConsents = this.consents.get(userId) ?? [];
    const relevant = userConsents
      .filter((c) => c.consentType === consentType)
      .sort((a, b) => b.timestamp - a.timestamp);

    return relevant.length > 0 && relevant[0].granted;
  }

  /**
   * Get all consent records for a user.
   * @param userId - User ID
   * @returns Array of consent records
   */
  getConsentHistory(userId: string): ConsentRecord[] {
    return [...(this.consents.get(userId) ?? [])];
  }

  /**
   * Export all user data for GDPR data portability (Article 20).
   * @param userId - User ID
   * @param profileData - User's profile data
   * @param loginHistory - User's login history
   * @param additionalData - Any additional data categories
   * @returns Structured data export
   */
  exportUserData(
    userId: string,
    profileData: Record<string, unknown>,
    loginHistory: GdprDataExport["loginHistory"] = [],
    additionalData: Record<string, unknown> = {}
  ): GdprDataExport {
    return {
      exportInfo: {
        userId,
        exportedAt: new Date().toISOString(),
        format: "JSON",
        version: "1.0",
      },
      profile: { ...profileData },
      consents: this.getConsentHistory(userId),
      loginHistory: [...loginHistory],
      additionalData: { ...additionalData },
    };
  }

  /**
   * Process a right to be forgotten / account deletion request (Article 17).
   * Deletes user data while respecting legal retention requirements.
   * @param userId - User ID
   * @param categories - Data categories to delete (defaults to all)
   * @returns Deletion result with details of what was/wasn't deleted
   */
  deleteUserData(
    userId: string,
    categories?: string[]
  ): DeletionResult {
    const targetCategories =
      categories ?? Array.from(this.retentionPolicies.keys());
    const deletedCategories: string[] = [];
    const retainedCategories: DeletionResult["retainedCategories"] = [];
    const now = Date.now();

    for (const category of targetCategories) {
      const policy = this.retentionPolicies.get(category);

      if (
        policy &&
        policy.legalBasis === "Legal obligation" &&
        policy.retentionDays !== null
      ) {
        // Must retain for legal reasons
        retainedCategories.push({
          category,
          reason: `Legal retention required: ${policy.legalBasis}`,
          retainedUntil:
            now + policy.retentionDays * 24 * 60 * 60 * 1000,
        });
      } else {
        deletedCategories.push(category);
      }
    }

    // Anonymize consent records instead of deleting
    const anonymizedId = `anon_${Date.now().toString(36)}`;

    const result: DeletionResult = {
      success: true,
      deletedCategories,
      retainedCategories,
      deletedAt: now,
      anonymizedId,
    };

    // Remove consent data (anonymize rather than delete for audit)
    const userConsents = this.consents.get(userId);
    if (userConsents) {
      for (const consent of userConsents) {
        consent.userId = anonymizedId;
        consent.ipAddress = "0.0.0.0";
      }
      this.consents.delete(userId);
      this.consents.set(anonymizedId, userConsents);
    }

    this.deletionLog.set(userId, result);
    return result;
  }

  /**
   * Check which data categories have expired per retention policy.
   * @param userId - User ID
   * @param dataTimestamps - Map of category to oldest data timestamp
   * @returns Categories that should be purged
   */
  checkRetention(
    userId: string,
    dataTimestamps: Map<string, number>
  ): string[] {
    const now = Date.now();
    const expired: string[] = [];

    for (const [category, timestamp] of dataTimestamps) {
      const policy = this.retentionPolicies.get(category);
      if (
        policy?.retentionDays !== null &&
        policy?.retentionDays !== undefined
      ) {
        const maxAge = policy.retentionDays * 24 * 60 * 60 * 1000;
        if (now - timestamp > maxAge) {
          expired.push(category);
        }
      }
    }

    return expired;
  }

  /**
   * Set or update a retention policy.
   * @param policy - Retention policy to set
   */
  setRetentionPolicy(policy: RetentionPolicy): void {
    this.retentionPolicies.set(policy.category, policy);
  }

  /**
   * Get all retention policies.
   * @returns Array of retention policies
   */
  getRetentionPolicies(): RetentionPolicy[] {
    return Array.from(this.retentionPolicies.values());
  }

  /**
   * Get the deletion log entry for a user.
   * @param userId - User ID
   * @returns Deletion result or undefined
   */
  getDeletionLog(userId: string): DeletionResult | undefined {
    return this.deletionLog.get(userId);
  }
}
