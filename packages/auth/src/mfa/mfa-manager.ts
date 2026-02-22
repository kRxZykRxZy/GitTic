/**
 * MFA orchestrator that manages multi-factor authentication flows.
 * Coordinates TOTP setup/verification and backup code recovery.
 * @module mfa/mfa-manager
 */

import {
  generateTOTPSecret,
  verifyTOTP,
  generateOTPAuthURI,
  type TOTPConfig,
  type TOTPSecret,
} from "./totp.js";
import {
  generateBackupCodes,
  validateBackupCode,
  getRemainingCodeCount,
  shouldWarnLowCodes,
  allCodesConsumed,
  getBackupCodeStats,
  type BackupCodeEntry,
  type BackupCodeConfig,
} from "./backup-codes.js";

/**
 * MFA method types supported by the system.
 */
export type MFAMethod = "totp" | "backup_code";

/**
 * MFA enrollment status for a user.
 */
export interface MFAEnrollment {
  /** Whether MFA is enabled for the user */
  enabled: boolean;
  /** Available MFA methods */
  methods: MFAMethod[];
  /** TOTP secret (hex-encoded) if TOTP is enabled */
  totpSecretHex: string | null;
  /** Hashed backup code entries */
  backupCodes: BackupCodeEntry[];
  /** When MFA was enabled */
  enabledAt: number | null;
  /** When MFA was last verified */
  lastVerifiedAt: number | null;
}

/**
 * Result of enabling MFA for a user.
 */
export interface MFAEnableResult {
  /** The TOTP secret for the user */
  totpSecret: TOTPSecret;
  /** otpauth:// URI for QR code generation */
  otpAuthUri: string;
  /** Plain-text backup codes (shown only once) */
  backupCodes: string[];
  /** The MFA enrollment record to store */
  enrollment: MFAEnrollment;
}

/**
 * Result of verifying an MFA code.
 */
export interface MFAVerifyResult {
  /** Whether verification succeeded */
  valid: boolean;
  /** Which method was used for verification */
  method: MFAMethod | null;
  /** Warning message (e.g., low backup codes) */
  warning: string | null;
}

/**
 * Configuration for the MFA manager.
 */
export interface MFAManagerConfig {
  /** Issuer name for TOTP (shown in authenticator apps) */
  issuer: string;
  /** TOTP configuration */
  totp?: TOTPConfig;
  /** Backup code configuration */
  backupCodes?: BackupCodeConfig;
}

/**
 * Create a default (empty) MFA enrollment record.
 * @returns An enrollment with MFA disabled
 */
export function createEmptyEnrollment(): MFAEnrollment {
  return {
    enabled: false,
    methods: [],
    totpSecretHex: null,
    backupCodes: [],
    enabledAt: null,
    lastVerifiedAt: null,
  };
}

/**
 * MFA manager class that orchestrates multi-factor authentication.
 */
export class MFAManager {
  private readonly issuer: string;
  private readonly totpConfig: TOTPConfig;
  private readonly backupCodeConfig: BackupCodeConfig;

  /**
   * Create a new MFA manager.
   * @param config - MFA manager configuration
   */
  constructor(config: MFAManagerConfig) {
    this.issuer = config.issuer;
    this.totpConfig = config.totp ?? {};
    this.backupCodeConfig = config.backupCodes ?? {};
  }

  /**
   * Enable MFA for a user by generating TOTP secret and backup codes.
   * The user must verify a TOTP code before MFA is fully activated.
   * @param accountName - User's account identifier (email or username)
   * @returns MFA enable result with secrets and codes to display
   */
  enableMFA(accountName: string): MFAEnableResult {
    const totpSecret = generateTOTPSecret();
    const otpAuthUri = generateOTPAuthURI(
      this.issuer,
      accountName,
      totpSecret.base32,
      this.totpConfig
    );
    const backupResult = generateBackupCodes(this.backupCodeConfig);

    const enrollment: MFAEnrollment = {
      enabled: true,
      methods: ["totp", "backup_code"],
      totpSecretHex: totpSecret.hex,
      backupCodes: backupResult.hashedEntries,
      enabledAt: Date.now(),
      lastVerifiedAt: null,
    };

    return {
      totpSecret,
      otpAuthUri,
      backupCodes: backupResult.plainCodes,
      enrollment,
    };
  }

  /**
   * Disable MFA for a user.
   * @param enrollment - The user's current MFA enrollment
   * @returns Updated enrollment with MFA disabled
   */
  disableMFA(enrollment: MFAEnrollment): MFAEnrollment {
    return {
      ...enrollment,
      enabled: false,
      methods: [],
      totpSecretHex: null,
      backupCodes: [],
      enabledAt: null,
      lastVerifiedAt: null,
    };
  }

  /**
   * Verify an MFA code (either TOTP or backup code).
   * Tries TOTP first, then falls back to backup code validation.
   * @param code - The code entered by the user
   * @param enrollment - The user's MFA enrollment record
   * @returns Verification result
   */
  verify(code: string, enrollment: MFAEnrollment): MFAVerifyResult {
    if (!enrollment.enabled) {
      return { valid: false, method: null, warning: "MFA is not enabled" };
    }

    // Try TOTP verification first
    if (enrollment.totpSecretHex && enrollment.methods.includes("totp")) {
      const secretBuffer = Buffer.from(enrollment.totpSecretHex, "hex");
      const totpResult = verifyTOTP(code, secretBuffer, this.totpConfig);

      if (totpResult.valid) {
        enrollment.lastVerifiedAt = Date.now();
        return { valid: true, method: "totp", warning: null };
      }
    }

    // Try backup code verification
    if (enrollment.methods.includes("backup_code")) {
      const backupValid = validateBackupCode(code, enrollment.backupCodes);

      if (backupValid) {
        enrollment.lastVerifiedAt = Date.now();

        let warning: string | null = null;
        if (allCodesConsumed(enrollment.backupCodes)) {
          warning =
            "All backup codes have been used. Please generate new backup codes.";
        } else if (shouldWarnLowCodes(enrollment.backupCodes)) {
          const remaining = getRemainingCodeCount(enrollment.backupCodes);
          warning = `Only ${remaining} backup code(s) remaining. Consider generating new codes.`;
        }

        return { valid: true, method: "backup_code", warning };
      }
    }

    return { valid: false, method: null, warning: null };
  }

  /**
   * Regenerate backup codes for a user (invalidates all existing codes).
   * @param enrollment - The user's MFA enrollment record
   * @returns Plain-text backup codes to display and updated enrollment
   */
  regenerateBackupCodes(enrollment: MFAEnrollment): {
    plainCodes: string[];
    enrollment: MFAEnrollment;
  } {
    const backupResult = generateBackupCodes(this.backupCodeConfig);

    const updated: MFAEnrollment = {
      ...enrollment,
      backupCodes: backupResult.hashedEntries,
    };

    return {
      plainCodes: backupResult.plainCodes,
      enrollment: updated,
    };
  }

  /**
   * Get MFA status information for a user.
   * @param enrollment - The user's MFA enrollment record
   * @returns Status summary
   */
  getStatus(enrollment: MFAEnrollment): {
    enabled: boolean;
    methods: MFAMethod[];
    backupCodeStats: ReturnType<typeof getBackupCodeStats>;
    lastVerifiedAt: number | null;
  } {
    return {
      enabled: enrollment.enabled,
      methods: enrollment.methods,
      backupCodeStats: getBackupCodeStats(enrollment.backupCodes),
      lastVerifiedAt: enrollment.lastVerifiedAt,
    };
  }

  /**
   * Check if MFA verification is required for a user.
   * @param enrollment - The user's MFA enrollment
   * @returns True if MFA is enabled and verification is needed
   */
  isVerificationRequired(enrollment: MFAEnrollment): boolean {
    return enrollment.enabled && enrollment.methods.length > 0;
  }
}
