/**
 * Terms of Service acceptance tracking.
 * Manages versioned terms documents, tracks user acceptance,
 * and enforces re-acceptance when terms are updated.
 * @module compliance/terms-tracker
 */

/**
 * Terms of Service document record.
 */
export interface TermsDocument {
  /** Unique version identifier (e.g., "2.1", "2024-01-15") */
  version: string;
  /** Type of document */
  type: TermsDocumentType;
  /** Title of the document */
  title: string;
  /** URL where the document can be read */
  url: string;
  /** SHA-256 hash of the document content for integrity */
  contentHash: string;
  /** When this version was published */
  publishedAt: number;
  /** Whether this is the current active version */
  active: boolean;
  /** Summary of changes from the previous version */
  changeSummary: string | null;
  /** Whether this version requires re-acceptance from existing users */
  requiresReAcceptance: boolean;
}

/**
 * Types of legal documents that can be tracked.
 */
export type TermsDocumentType =
  | "terms_of_service"
  | "privacy_policy"
  | "acceptable_use"
  | "data_processing"
  | "cookie_policy";

/**
 * User's acceptance of a specific terms version.
 */
export interface TermsAcceptance {
  /** User ID */
  userId: string;
  /** Document type */
  documentType: TermsDocumentType;
  /** Accepted version */
  version: string;
  /** When the user accepted */
  acceptedAt: number;
  /** IP address when accepted */
  ipAddress: string;
  /** User agent when accepted */
  userAgent: string;
}

/**
 * Status of a user's terms acceptance.
 */
export interface TermsAcceptanceStatus {
  /** Document type */
  documentType: TermsDocumentType;
  /** Whether the user has accepted the current version */
  currentVersionAccepted: boolean;
  /** Current active version */
  currentVersion: string | null;
  /** Version the user last accepted */
  acceptedVersion: string | null;
  /** When the user last accepted */
  lastAcceptedAt: number | null;
  /** Whether re-acceptance is required */
  requiresReAcceptance: boolean;
}

/**
 * Configuration for the terms tracker.
 */
export interface TermsTrackerConfig {
  /** Document types to track */
  trackedDocuments?: TermsDocumentType[];
  /** Whether to block access if terms are not accepted */
  enforceAcceptance?: boolean;
  /** Grace period in days after a new version before blocking */
  gracePeriodDays?: number;
}

/**
 * Terms of Service acceptance tracker.
 */
export class TermsTracker {
  private readonly documents = new Map<string, TermsDocument>();
  private readonly acceptances = new Map<string, TermsAcceptance[]>();
  private readonly config: Required<TermsTrackerConfig>;

  /**
   * Create a new terms tracker.
   * @param config - Tracker configuration
   */
  constructor(config: TermsTrackerConfig = {}) {
    this.config = {
      trackedDocuments: config.trackedDocuments ?? [
        "terms_of_service",
        "privacy_policy",
      ],
      enforceAcceptance: config.enforceAcceptance ?? true,
      gracePeriodDays: config.gracePeriodDays ?? 30,
    };
  }

  /**
   * Publish a new version of a terms document.
   * Marks the previous active version as inactive.
   * @param document - The document to publish
   */
  publishDocument(document: TermsDocument): void {
    // Deactivate previous versions of the same type
    for (const [key, doc] of this.documents) {
      if (doc.type === document.type && doc.active) {
        doc.active = false;
      }
    }

    const docKey = `${document.type}:${document.version}`;
    this.documents.set(docKey, { ...document, active: true });
  }

  /**
   * Get the current active version of a document type.
   * @param type - Document type
   * @returns Active document or null
   */
  getCurrentDocument(type: TermsDocumentType): TermsDocument | null {
    for (const doc of this.documents.values()) {
      if (doc.type === type && doc.active) {
        return { ...doc };
      }
    }
    return null;
  }

  /**
   * Get all versions of a document type.
   * @param type - Document type
   * @returns Array of document versions, newest first
   */
  getDocumentHistory(type: TermsDocumentType): TermsDocument[] {
    const docs: TermsDocument[] = [];
    for (const doc of this.documents.values()) {
      if (doc.type === type) {
        docs.push({ ...doc });
      }
    }
    return docs.sort((a, b) => b.publishedAt - a.publishedAt);
  }

  /**
   * Record a user's acceptance of a terms document.
   * @param userId - User ID
   * @param documentType - Type of document accepted
   * @param version - Version accepted
   * @param ipAddress - IP address
   * @param userAgent - User agent
   */
  recordAcceptance(
    userId: string,
    documentType: TermsDocumentType,
    version: string,
    ipAddress: string,
    userAgent: string
  ): void {
    const acceptance: TermsAcceptance = {
      userId,
      documentType,
      version,
      acceptedAt: Date.now(),
      ipAddress,
      userAgent,
    };

    let userAcceptances = this.acceptances.get(userId);
    if (!userAcceptances) {
      userAcceptances = [];
      this.acceptances.set(userId, userAcceptances);
    }
    userAcceptances.push(acceptance);
  }

  /**
   * Get the latest acceptance of a document type by a user.
   * @param userId - User ID
   * @param documentType - Document type
   * @returns Latest acceptance or null
   */
  getLatestAcceptance(
    userId: string,
    documentType: TermsDocumentType
  ): TermsAcceptance | null {
    const userAcceptances = this.acceptances.get(userId) ?? [];
    const relevant = userAcceptances
      .filter((a) => a.documentType === documentType)
      .sort((a, b) => b.acceptedAt - a.acceptedAt);

    return relevant.length > 0 ? relevant[0] : null;
  }

  /**
   * Check if a user needs to accept or re-accept any terms.
   * @param userId - User ID
   * @returns Array of acceptance statuses for tracked documents
   */
  checkAcceptanceStatus(userId: string): TermsAcceptanceStatus[] {
    const statuses: TermsAcceptanceStatus[] = [];

    for (const docType of this.config.trackedDocuments) {
      const currentDoc = this.getCurrentDocument(docType);
      const latestAcceptance = this.getLatestAcceptance(userId, docType);

      const currentVersionAccepted =
        currentDoc !== null &&
        latestAcceptance !== null &&
        latestAcceptance.version === currentDoc.version;

      const requiresReAcceptance =
        currentDoc !== null &&
        currentDoc.requiresReAcceptance &&
        !currentVersionAccepted;

      statuses.push({
        documentType: docType,
        currentVersionAccepted,
        currentVersion: currentDoc?.version ?? null,
        acceptedVersion: latestAcceptance?.version ?? null,
        lastAcceptedAt: latestAcceptance?.acceptedAt ?? null,
        requiresReAcceptance,
      });
    }

    return statuses;
  }

  /**
   * Check if a user is blocked from access due to unaccepted terms.
   * @param userId - User ID
   * @returns True if the user must accept terms before proceeding
   */
  isAccessBlocked(userId: string): boolean {
    if (!this.config.enforceAcceptance) {
      return false;
    }

    const statuses = this.checkAcceptanceStatus(userId);
    const now = Date.now();
    const gracePeriodMs =
      this.config.gracePeriodDays * 24 * 60 * 60 * 1000;

    for (const status of statuses) {
      if (status.requiresReAcceptance) {
        const currentDoc = this.getCurrentDocument(status.documentType);
        if (currentDoc) {
          const graceExpired =
            now - currentDoc.publishedAt > gracePeriodMs;
          if (graceExpired) {
            return true;
          }
        }
      }

      // Never accepted at all
      if (
        status.currentVersion !== null &&
        status.acceptedVersion === null
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all acceptance records for a user.
   * @param userId - User ID
   * @returns Array of all acceptance records
   */
  getUserAcceptanceHistory(userId: string): TermsAcceptance[] {
    return [...(this.acceptances.get(userId) ?? [])];
  }

  /**
   * Get users who have not accepted the current version of a document.
   * @param documentType - Document type to check
   * @param allUserIds - Array of all user IDs to check
   * @returns Array of user IDs who need to accept
   */
  getUsersNeedingAcceptance(
    documentType: TermsDocumentType,
    allUserIds: string[]
  ): string[] {
    const currentDoc = this.getCurrentDocument(documentType);
    if (!currentDoc) {
      return [];
    }

    return allUserIds.filter((userId) => {
      const latest = this.getLatestAcceptance(userId, documentType);
      return !latest || latest.version !== currentDoc.version;
    });
  }
}
