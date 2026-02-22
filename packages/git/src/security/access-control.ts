/** Access permission level for a repository. */
export type PermissionLevel = "none" | "read" | "write" | "admin";

/** Represents a user with repository permissions. */
export interface UserPermission {
  userId: string;
  username: string;
  permission: PermissionLevel;
}

/** Repository access policy with ownership and team information. */
export interface AccessPolicy {
  ownerId: string;
  ownerType: "user" | "org";
  visibility: "public" | "private" | "internal";
  collaborators: UserPermission[];
  teamPermissions: TeamPermission[];
}

/** Team-level permissions for organization repositories. */
export interface TeamPermission {
  teamId: string;
  teamName: string;
  permission: PermissionLevel;
  members: string[];
}

/** Result of an access check with reason for the decision. */
export interface AccessCheckResult {
  allowed: boolean;
  permission: PermissionLevel;
  reason: string;
}

/**
 * Permission hierarchy for comparing access levels.
 * Higher numbers indicate more permissive access.
 */
const PERMISSION_HIERARCHY: Record<PermissionLevel, number> = {
  none: 0,
  read: 1,
  write: 2,
  admin: 3,
};

/**
 * Check if a user has read access to a repository.
 * Public repos always allow read; private repos require explicit permission.
 */
export function canRead(
  userId: string,
  policy: AccessPolicy
): AccessCheckResult {
  if (policy.visibility === "public") {
    return {
      allowed: true,
      permission: "read",
      reason: "Repository is public",
    };
  }

  return checkPermission(userId, policy, "read");
}

/**
 * Check if a user has write access to a repository.
 * Requires explicit write or admin permission on the repository.
 */
export function canWrite(
  userId: string,
  policy: AccessPolicy
): AccessCheckResult {
  return checkPermission(userId, policy, "write");
}

/**
 * Check if a user has admin access to a repository.
 * Only repository owners and explicitly granted admins are allowed.
 */
export function canAdmin(
  userId: string,
  policy: AccessPolicy
): AccessCheckResult {
  return checkPermission(userId, policy, "admin");
}

/**
 * Resolve the effective permission level for a user.
 * Considers direct permissions, team memberships, and ownership.
 */
export function resolvePermission(
  userId: string,
  policy: AccessPolicy
): PermissionLevel {
  if (policy.ownerId === userId) {
    return "admin";
  }

  let maxLevel: PermissionLevel = "none";

  const directPermission = policy.collaborators.find(
    (c) => c.userId === userId
  );
  if (directPermission) {
    maxLevel = higherPermission(maxLevel, directPermission.permission);
  }

  for (const team of policy.teamPermissions) {
    if (team.members.includes(userId)) {
      maxLevel = higherPermission(maxLevel, team.permission);
    }
  }

  if (maxLevel === "none" && policy.visibility === "public") {
    return "read";
  }

  if (maxLevel === "none" && policy.visibility === "internal") {
    return "read";
  }

  return maxLevel;
}

/**
 * Check if a user has at least the required permission level.
 * Evaluates ownership, direct grants, and team memberships.
 */
function checkPermission(
  userId: string,
  policy: AccessPolicy,
  required: PermissionLevel
): AccessCheckResult {
  const effectiveLevel = resolvePermission(userId, policy);
  const allowed = PERMISSION_HIERARCHY[effectiveLevel] >= PERMISSION_HIERARCHY[required];

  let reason: string;
  if (policy.ownerId === userId) {
    reason = "User is repository owner";
  } else if (allowed) {
    reason = `User has ${effectiveLevel} permission (required: ${required})`;
  } else {
    reason = `Insufficient permissions: ${effectiveLevel} < ${required}`;
  }

  return { allowed, permission: effectiveLevel, reason };
}

/**
 * Return the higher of two permission levels.
 * Uses the permission hierarchy to compare levels.
 */
function higherPermission(
  a: PermissionLevel,
  b: PermissionLevel
): PermissionLevel {
  return PERMISSION_HIERARCHY[a] >= PERMISSION_HIERARCHY[b] ? a : b;
}

/**
 * Create a default access policy for a new repository.
 * Sets the creator as owner with admin permissions.
 */
export function createDefaultPolicy(
  ownerId: string,
  ownerType: "user" | "org",
  visibility: "public" | "private" | "internal" = "private"
): AccessPolicy {
  return {
    ownerId,
    ownerType,
    visibility,
    collaborators: [],
    teamPermissions: [],
  };
}

/**
 * Add a collaborator to the repository access policy.
 * If the user already exists, updates their permission level.
 */
export function addCollaborator(
  policy: AccessPolicy,
  userId: string,
  username: string,
  permission: PermissionLevel
): AccessPolicy {
  const existing = policy.collaborators.findIndex((c) => c.userId === userId);

  const updated = { ...policy, collaborators: [...policy.collaborators] };

  if (existing >= 0) {
    updated.collaborators[existing] = { userId, username, permission };
  } else {
    updated.collaborators.push({ userId, username, permission });
  }

  return updated;
}

/**
 * Remove a collaborator from the repository access policy.
 * Returns the updated policy with the user removed.
 */
export function removeCollaborator(
  policy: AccessPolicy,
  userId: string
): AccessPolicy {
  return {
    ...policy,
    collaborators: policy.collaborators.filter((c) => c.userId !== userId),
  };
}
