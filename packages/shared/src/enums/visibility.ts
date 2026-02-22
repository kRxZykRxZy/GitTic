/**
 * Visibility enums for controlling resource access levels.
 * @module enums/visibility
 */

/**
 * Visibility levels for projects and repositories.
 */
export enum ProjectVisibilityEnum {
  /** Visible to everyone, including unauthenticated users. */
  Public = "public",
  /** Visible only to organization members. */
  Internal = "internal",
  /** Visible only to explicitly granted users and teams. */
  Private = "private",
}

/**
 * Visibility levels for user profiles.
 */
export enum ProfileVisibility {
  /** Profile is visible to everyone. */
  Public = "public",
  /** Profile is visible only to authenticated users. */
  Authenticated = "authenticated",
  /** Profile is visible only to organization members. */
  Organization = "organization",
  /** Profile is visible only to the user themselves. */
  Private = "private",
}

/**
 * Visibility levels for teams within an organization.
 */
export enum TeamVisibility {
  /** Team is visible to all organization members. */
  Visible = "visible",
  /** Team is only visible to its members and org admins. */
  Secret = "secret",
}

/**
 * Visibility levels for organization membership lists.
 */
export enum MemberListVisibility {
  /** Member list is publicly visible. */
  Public = "public",
  /** Member list is visible only to organization members. */
  MembersOnly = "members_only",
  /** Member list is visible only to admins. */
  AdminOnly = "admin_only",
}

/**
 * Visibility levels for activity feeds.
 */
export enum ActivityVisibility {
  /** Activity is visible to everyone who can see the resource. */
  Default = "default",
  /** Activity is visible only to team members. */
  Team = "team",
  /** Activity is visible only to admins. */
  Admin = "admin",
  /** Activity is never shown in feeds. */
  Hidden = "hidden",
}

/**
 * Display labels for project visibility levels.
 */
export const PROJECT_VISIBILITY_LABELS: Record<ProjectVisibilityEnum, string> = {
  [ProjectVisibilityEnum.Public]: "Public",
  [ProjectVisibilityEnum.Internal]: "Internal",
  [ProjectVisibilityEnum.Private]: "Private",
} as const;

/**
 * Descriptions for project visibility levels.
 */
export const PROJECT_VISIBILITY_DESCRIPTIONS: Record<ProjectVisibilityEnum, string> = {
  [ProjectVisibilityEnum.Public]: "Anyone on the internet can see this project.",
  [ProjectVisibilityEnum.Internal]: "Only members of the organization can see this project.",
  [ProjectVisibilityEnum.Private]: "Only explicitly invited users can see this project.",
} as const;

/**
 * Icons for project visibility levels.
 */
export const PROJECT_VISIBILITY_ICONS: Record<ProjectVisibilityEnum, string> = {
  [ProjectVisibilityEnum.Public]: "globe",
  [ProjectVisibilityEnum.Internal]: "building",
  [ProjectVisibilityEnum.Private]: "lock",
} as const;

/**
 * Display labels for profile visibility levels.
 */
export const PROFILE_VISIBILITY_LABELS: Record<ProfileVisibility, string> = {
  [ProfileVisibility.Public]: "Public",
  [ProfileVisibility.Authenticated]: "Authenticated Users",
  [ProfileVisibility.Organization]: "Organization Members",
  [ProfileVisibility.Private]: "Private",
} as const;
