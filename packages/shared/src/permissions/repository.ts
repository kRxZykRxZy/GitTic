/**
 * Permission utilities and constants
 * @module @platform/shared/permissions/repository
 */

import type { CollaboratorPermission } from '../types/repository.js';

export const PERMISSION_LEVELS: Record<CollaboratorPermission, number> = {
  pull: 1,
  triage: 2,
  push: 3,
  maintain: 4,
  admin: 5,
};

export const PERMISSION_LABELS: Record<CollaboratorPermission, string> = {
  pull: 'Read',
  triage: 'Triage',
  push: 'Write',
  maintain: 'Maintain',
  admin: 'Admin',
};

export const PERMISSION_DESCRIPTIONS: Record<CollaboratorPermission, string> = {
  pull: 'Can view and clone the repository',
  triage: 'Can read and triage issues and pull requests',
  push: 'Can push to the repository',
  maintain: 'Can manage the repository without access to sensitive actions',
  admin: 'Full access to the repository, including sensitive actions',
};

export function hasPermission(
  userPermission: CollaboratorPermission,
  requiredPermission: CollaboratorPermission,
): boolean {
  return PERMISSION_LEVELS[userPermission] >= PERMISSION_LEVELS[requiredPermission];
}

export function getPermissionBadgeClass(permission: CollaboratorPermission): string {
  const classes: Record<CollaboratorPermission, string> = {
    admin: 'badge-danger',
    maintain: 'badge-warning',
    push: 'badge-success',
    triage: 'badge-info',
    pull: 'badge-secondary',
  };
  return classes[permission];
}
