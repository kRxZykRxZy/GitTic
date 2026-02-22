"use strict";
/**
 * Visibility enums for controlling resource access levels.
 * @module enums/visibility
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROFILE_VISIBILITY_LABELS = exports.PROJECT_VISIBILITY_ICONS = exports.PROJECT_VISIBILITY_DESCRIPTIONS = exports.PROJECT_VISIBILITY_LABELS = exports.ActivityVisibility = exports.MemberListVisibility = exports.TeamVisibility = exports.ProfileVisibility = exports.ProjectVisibilityEnum = void 0;
/**
 * Visibility levels for projects and repositories.
 */
var ProjectVisibilityEnum;
(function (ProjectVisibilityEnum) {
    /** Visible to everyone, including unauthenticated users. */
    ProjectVisibilityEnum["Public"] = "public";
    /** Visible only to organization members. */
    ProjectVisibilityEnum["Internal"] = "internal";
    /** Visible only to explicitly granted users and teams. */
    ProjectVisibilityEnum["Private"] = "private";
})(ProjectVisibilityEnum || (exports.ProjectVisibilityEnum = ProjectVisibilityEnum = {}));
/**
 * Visibility levels for user profiles.
 */
var ProfileVisibility;
(function (ProfileVisibility) {
    /** Profile is visible to everyone. */
    ProfileVisibility["Public"] = "public";
    /** Profile is visible only to authenticated users. */
    ProfileVisibility["Authenticated"] = "authenticated";
    /** Profile is visible only to organization members. */
    ProfileVisibility["Organization"] = "organization";
    /** Profile is visible only to the user themselves. */
    ProfileVisibility["Private"] = "private";
})(ProfileVisibility || (exports.ProfileVisibility = ProfileVisibility = {}));
/**
 * Visibility levels for teams within an organization.
 */
var TeamVisibility;
(function (TeamVisibility) {
    /** Team is visible to all organization members. */
    TeamVisibility["Visible"] = "visible";
    /** Team is only visible to its members and org admins. */
    TeamVisibility["Secret"] = "secret";
})(TeamVisibility || (exports.TeamVisibility = TeamVisibility = {}));
/**
 * Visibility levels for organization membership lists.
 */
var MemberListVisibility;
(function (MemberListVisibility) {
    /** Member list is publicly visible. */
    MemberListVisibility["Public"] = "public";
    /** Member list is visible only to organization members. */
    MemberListVisibility["MembersOnly"] = "members_only";
    /** Member list is visible only to admins. */
    MemberListVisibility["AdminOnly"] = "admin_only";
})(MemberListVisibility || (exports.MemberListVisibility = MemberListVisibility = {}));
/**
 * Visibility levels for activity feeds.
 */
var ActivityVisibility;
(function (ActivityVisibility) {
    /** Activity is visible to everyone who can see the resource. */
    ActivityVisibility["Default"] = "default";
    /** Activity is visible only to team members. */
    ActivityVisibility["Team"] = "team";
    /** Activity is visible only to admins. */
    ActivityVisibility["Admin"] = "admin";
    /** Activity is never shown in feeds. */
    ActivityVisibility["Hidden"] = "hidden";
})(ActivityVisibility || (exports.ActivityVisibility = ActivityVisibility = {}));
/**
 * Display labels for project visibility levels.
 */
exports.PROJECT_VISIBILITY_LABELS = {
    [ProjectVisibilityEnum.Public]: "Public",
    [ProjectVisibilityEnum.Internal]: "Internal",
    [ProjectVisibilityEnum.Private]: "Private",
};
/**
 * Descriptions for project visibility levels.
 */
exports.PROJECT_VISIBILITY_DESCRIPTIONS = {
    [ProjectVisibilityEnum.Public]: "Anyone on the internet can see this project.",
    [ProjectVisibilityEnum.Internal]: "Only members of the organization can see this project.",
    [ProjectVisibilityEnum.Private]: "Only explicitly invited users can see this project.",
};
/**
 * Icons for project visibility levels.
 */
exports.PROJECT_VISIBILITY_ICONS = {
    [ProjectVisibilityEnum.Public]: "globe",
    [ProjectVisibilityEnum.Internal]: "building",
    [ProjectVisibilityEnum.Private]: "lock",
};
/**
 * Display labels for profile visibility levels.
 */
exports.PROFILE_VISIBILITY_LABELS = {
    [ProfileVisibility.Public]: "Public",
    [ProfileVisibility.Authenticated]: "Authenticated Users",
    [ProfileVisibility.Organization]: "Organization Members",
    [ProfileVisibility.Private]: "Private",
};
//# sourceMappingURL=visibility.js.map