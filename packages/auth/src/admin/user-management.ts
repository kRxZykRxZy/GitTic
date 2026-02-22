/**
 * Admin user management operations.
 * Provides listing, role changes, suspension, banning, deletion,
 * searching, and bulk operations for user administration.
 * @module admin/user-management
 */

import type { UserRole } from "@platform/shared";

/**
 * User record for admin management purposes.
 */
export interface ManagedUser {
  /** User ID */
  id: string;
  /** Username */
  username: string;
  /** Email address */
  email: string;
  /** Display name */
  displayName: string;
  /** User role */
  role: UserRole;
  /** Whether the account is suspended */
  suspended: boolean;
  /** Suspension end date (null for indefinite) */
  suspendedUntil: number | null;
  /** Suspension reason */
  suspensionReason: string | null;
  /** Whether the account is banned */
  banned: boolean;
  /** Ban reason */
  banReason: string | null;
  /** Account creation date */
  createdAt: number;
  /** Last login date */
  lastLoginAt: number | null;
  /** Whether the account is deleted (soft delete) */
  deleted: boolean;
}

/**
 * User search filters.
 */
export interface UserSearchFilters {
  /** Search by username or email (partial match) */
  query?: string;
  /** Filter by role */
  role?: UserRole;
  /** Filter by suspension status */
  suspended?: boolean;
  /** Filter by ban status */
  banned?: boolean;
  /** Filter by deleted status */
  includeDeleted?: boolean;
  /** Created after this date */
  createdAfter?: number;
  /** Created before this date */
  createdBefore?: number;
  /** Sort field */
  sortBy?: "username" | "email" | "createdAt" | "lastLoginAt";
  /** Sort direction */
  sortOrder?: "asc" | "desc";
  /** Page number (1-based) */
  page?: number;
  /** Items per page */
  pageSize?: number;
}

/**
 * Paginated result set.
 */
export interface PaginatedResult<T> {
  /** Items in the current page */
  items: T[];
  /** Total number of matching items */
  total: number;
  /** Current page number */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

/**
 * Result of a bulk operation.
 */
export interface BulkOperationResult {
  /** Number of users successfully processed */
  succeeded: number;
  /** Number of users that failed */
  failed: number;
  /** Error details for failed operations */
  errors: Array<{ userId: string; error: string }>;
}

/**
 * Admin user management class.
 */
export class UserManagement {
  private readonly users = new Map<string, ManagedUser>();

  /**
   * Add a user to the management store.
   * @param user - User record to add
   */
  addUser(user: ManagedUser): void {
    this.users.set(user.id, { ...user });
  }

  /**
   * Get a user by ID.
   * @param userId - User ID
   * @returns User record or null
   */
  getUser(userId: string): ManagedUser | null {
    const user = this.users.get(userId);
    return user ? { ...user } : null;
  }

  /**
   * List users with filtering, sorting, and pagination.
   * @param filters - Search and filter options
   * @returns Paginated user list
   */
  listUsers(filters: UserSearchFilters = {}): PaginatedResult<ManagedUser> {
    let results = Array.from(this.users.values());

    // Apply filters
    if (filters.query) {
      const q = filters.query.toLowerCase();
      results = results.filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.displayName.toLowerCase().includes(q)
      );
    }

    if (filters.role) {
      results = results.filter((u) => u.role === filters.role);
    }

    if (filters.suspended !== undefined) {
      results = results.filter((u) => u.suspended === filters.suspended);
    }

    if (filters.banned !== undefined) {
      results = results.filter((u) => u.banned === filters.banned);
    }

    if (!filters.includeDeleted) {
      results = results.filter((u) => !u.deleted);
    }

    if (filters.createdAfter) {
      results = results.filter(
        (u) => u.createdAt >= filters.createdAfter!
      );
    }

    if (filters.createdBefore) {
      results = results.filter(
        (u) => u.createdAt <= filters.createdBefore!
      );
    }

    // Sort
    const sortBy = filters.sortBy ?? "createdAt";
    const sortOrder = filters.sortOrder ?? "desc";
    results.sort((a, b) => {
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      const diff = (aVal as number) - (bVal as number);
      return sortOrder === "asc" ? diff : -diff;
    });

    // Paginate
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 20));
    const total = results.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const items = results.slice(start, start + pageSize).map((u) => ({
      ...u,
    }));

    return {
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Change a user's role.
   * @param userId - User ID
   * @param newRole - New role to assign
   * @returns True if the role was changed
   */
  changeRole(userId: string, newRole: UserRole): boolean {
    const user = this.users.get(userId);
    if (!user || user.deleted) {
      return false;
    }
    user.role = newRole;
    return true;
  }

  /**
   * Suspend a user account.
   * @param userId - User ID
   * @param reason - Reason for suspension
   * @param durationMs - Suspension duration in ms (null for indefinite)
   * @returns True if the user was suspended
   */
  suspendUser(
    userId: string,
    reason: string,
    durationMs: number | null = null
  ): boolean {
    const user = this.users.get(userId);
    if (!user || user.deleted || user.banned) {
      return false;
    }
    user.suspended = true;
    user.suspensionReason = reason;
    user.suspendedUntil =
      durationMs !== null ? Date.now() + durationMs : null;
    return true;
  }

  /**
   * Unsuspend a user account.
   * @param userId - User ID
   * @returns True if the user was unsuspended
   */
  unsuspendUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.suspended) {
      return false;
    }
    user.suspended = false;
    user.suspendedUntil = null;
    user.suspensionReason = null;
    return true;
  }

  /**
   * Ban a user account permanently.
   * @param userId - User ID
   * @param reason - Reason for banning
   * @returns True if the user was banned
   */
  banUser(userId: string, reason: string): boolean {
    const user = this.users.get(userId);
    if (!user || user.deleted) {
      return false;
    }
    user.banned = true;
    user.banReason = reason;
    user.suspended = false;
    user.suspendedUntil = null;
    return true;
  }

  /**
   * Unban a user account.
   * @param userId - User ID
   * @returns True if the user was unbanned
   */
  unbanUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.banned) {
      return false;
    }
    user.banned = false;
    user.banReason = null;
    return true;
  }

  /**
   * Soft-delete a user account.
   * @param userId - User ID
   * @returns True if the user was deleted
   */
  deleteUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user || user.deleted) {
      return false;
    }
    user.deleted = true;
    return true;
  }

  /**
   * Restore a soft-deleted user account.
   * @param userId - User ID
   * @returns True if the user was restored
   */
  restoreUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user || !user.deleted) {
      return false;
    }
    user.deleted = false;
    return true;
  }

  /**
   * Perform a bulk role change.
   * @param userIds - Array of user IDs
   * @param newRole - New role to assign
   * @returns Bulk operation result
   */
  bulkChangeRole(
    userIds: string[],
    newRole: UserRole
  ): BulkOperationResult {
    let succeeded = 0;
    let failed = 0;
    const errors: BulkOperationResult["errors"] = [];

    for (const userId of userIds) {
      if (this.changeRole(userId, newRole)) {
        succeeded++;
      } else {
        failed++;
        errors.push({ userId, error: "User not found or deleted" });
      }
    }

    return { succeeded, failed, errors };
  }

  /**
   * Perform a bulk suspension.
   * @param userIds - Array of user IDs
   * @param reason - Suspension reason
   * @param durationMs - Suspension duration
   * @returns Bulk operation result
   */
  bulkSuspend(
    userIds: string[],
    reason: string,
    durationMs: number | null = null
  ): BulkOperationResult {
    let succeeded = 0;
    let failed = 0;
    const errors: BulkOperationResult["errors"] = [];

    for (const userId of userIds) {
      if (this.suspendUser(userId, reason, durationMs)) {
        succeeded++;
      } else {
        failed++;
        errors.push({ userId, error: "User not found, deleted, or banned" });
      }
    }

    return { succeeded, failed, errors };
  }

  /**
   * Get user statistics.
   * @returns Object with user count breakdowns
   */
  getStatistics(): {
    total: number;
    byRole: Record<string, number>;
    suspended: number;
    banned: number;
    deleted: number;
    active: number;
  } {
    let total = 0;
    let suspended = 0;
    let banned = 0;
    let deleted = 0;
    const byRole: Record<string, number> = {};

    for (const user of this.users.values()) {
      total++;
      if (user.suspended) suspended++;
      if (user.banned) banned++;
      if (user.deleted) deleted++;
      byRole[user.role] = (byRole[user.role] ?? 0) + 1;
    }

    return {
      total,
      byRole,
      suspended,
      banned,
      deleted,
      active: total - deleted - banned,
    };
  }
}
