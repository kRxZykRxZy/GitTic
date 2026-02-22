/**
 * First user is admin logic.
 * Implements the pattern where the first user to register on the platform
 * is automatically assigned the admin role.
 * @module admin/first-user-admin
 */

import type { UserRole } from "@platform/shared";

/**
 * User count provider interface.
 * Abstracts the database layer for checking user count.
 */
export interface UserCountProvider {
  /** Get the total number of registered users */
  getUserCount(): Promise<number>;
}

/**
 * In-memory user count provider for testing.
 */
export class InMemoryUserCountProvider implements UserCountProvider {
  private count: number;

  /**
   * @param initialCount - Starting user count
   */
  constructor(initialCount: number = 0) {
    this.count = initialCount;
  }

  /** @inheritdoc */
  async getUserCount(): Promise<number> {
    return this.count;
  }

  /**
   * Set the user count (for testing).
   * @param count - New count value
   */
  setCount(count: number): void {
    this.count = count;
  }

  /**
   * Increment the user count.
   */
  increment(): void {
    this.count++;
  }
}

/**
 * Configuration for the first-user-admin feature.
 */
export interface FirstUserAdminConfig {
  /** Whether the feature is enabled (default: true) */
  enabled?: boolean;
  /** Role to assign to the first user (default: "admin") */
  firstUserRole?: UserRole;
  /** Role to assign to subsequent users (default: "user") */
  defaultRole?: UserRole;
  /** Maximum number of initial admins (default: 1) */
  maxInitialAdmins?: number;
  /** Whether to log when the first admin is created */
  logFirstAdmin?: boolean;
}

/**
 * Result of determining a new user's role.
 */
export interface RoleDetermination {
  /** The assigned role */
  role: UserRole;
  /** Whether this user was auto-promoted to admin */
  autoPromoted: boolean;
  /** Reason for the role assignment */
  reason: string;
}

/**
 * Default configuration values.
 */
const DEFAULTS: Required<FirstUserAdminConfig> = {
  enabled: true,
  firstUserRole: "admin",
  defaultRole: "user",
  maxInitialAdmins: 1,
  logFirstAdmin: true,
};

/**
 * First-user admin manager.
 * Determines whether new registrations should be granted admin privileges.
 */
export class FirstUserAdmin {
  private readonly config: Required<FirstUserAdminConfig>;
  private readonly userCountProvider: UserCountProvider;
  private promotionLog: Array<{
    userId: string;
    role: UserRole;
    timestamp: number;
    reason: string;
  }> = [];

  /**
   * Create a new FirstUserAdmin manager.
   * @param userCountProvider - Provider for user count lookups
   * @param config - Feature configuration
   */
  constructor(
    userCountProvider: UserCountProvider,
    config: FirstUserAdminConfig = {}
  ) {
    this.userCountProvider = userCountProvider;
    this.config = {
      enabled: config.enabled ?? DEFAULTS.enabled,
      firstUserRole: config.firstUserRole ?? DEFAULTS.firstUserRole,
      defaultRole: config.defaultRole ?? DEFAULTS.defaultRole,
      maxInitialAdmins:
        config.maxInitialAdmins ?? DEFAULTS.maxInitialAdmins,
      logFirstAdmin: config.logFirstAdmin ?? DEFAULTS.logFirstAdmin,
    };
  }

  /**
   * Determine the role for a new user registration.
   * @param userId - The new user's ID
   * @returns Role determination result
   */
  async determineRole(userId: string): Promise<RoleDetermination> {
    if (!this.config.enabled) {
      return {
        role: this.config.defaultRole,
        autoPromoted: false,
        reason: "First-user-admin feature is disabled",
      };
    }

    const currentCount = await this.userCountProvider.getUserCount();

    if (currentCount < this.config.maxInitialAdmins) {
      const result: RoleDetermination = {
        role: this.config.firstUserRole,
        autoPromoted: true,
        reason: `Auto-promoted to ${this.config.firstUserRole}: user #${currentCount + 1} of ${this.config.maxInitialAdmins} initial admin(s)`,
      };

      if (this.config.logFirstAdmin) {
        this.promotionLog.push({
          userId,
          role: this.config.firstUserRole,
          timestamp: Date.now(),
          reason: result.reason,
        });
      }

      return result;
    }

    return {
      role: this.config.defaultRole,
      autoPromoted: false,
      reason: `Default role assigned: platform already has ${currentCount} user(s)`,
    };
  }

  /**
   * Check if the platform needs initial setup (no users yet).
   * @returns True if no users exist
   */
  async isInitialSetup(): Promise<boolean> {
    const count = await this.userCountProvider.getUserCount();
    return count === 0;
  }

  /**
   * Check if more initial admin slots are available.
   * @returns True if more auto-promoted admins can be created
   */
  async hasAdminSlots(): Promise<boolean> {
    if (!this.config.enabled) {
      return false;
    }
    const count = await this.userCountProvider.getUserCount();
    return count < this.config.maxInitialAdmins;
  }

  /**
   * Get the number of remaining admin slots.
   * @returns Number of remaining auto-promotion slots
   */
  async remainingAdminSlots(): Promise<number> {
    if (!this.config.enabled) {
      return 0;
    }
    const count = await this.userCountProvider.getUserCount();
    return Math.max(0, this.config.maxInitialAdmins - count);
  }

  /**
   * Get the log of auto-promoted users.
   * @returns Array of promotion log entries
   */
  getPromotionLog(): Array<{
    userId: string;
    role: UserRole;
    timestamp: number;
    reason: string;
  }> {
    return [...this.promotionLog];
  }

  /**
   * Check if the feature is enabled.
   * @returns True if first-user-admin is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Get the current configuration.
   * @returns Current config (readonly)
   */
  getConfig(): Readonly<Required<FirstUserAdminConfig>> {
    return { ...this.config };
  }
}
