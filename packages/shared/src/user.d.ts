/** User roles in the platform */
export type UserRole = "user" | "moderator" | "admin";
/** User account */
export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    displayName?: string;
    avatarUrl?: string;
    bio?: string;
    suspended: boolean;
    suspendedUntil?: string;
    createdAt: string;
    updatedAt: string;
}
/** Session record */
export interface Session {
    id: string;
    userId: string;
    token: string;
    ipAddress?: string;
    userAgent?: string;
    expiresAt: string;
    createdAt: string;
}
/** Organization */
export interface Organization {
    id: string;
    name: string;
    slug: string;
    description?: string;
    avatarUrl?: string;
    ownerId: string;
    isPrivate: boolean;
    maxRepos: number;
    maxMembers: number;
    createdAt: string;
    updatedAt: string;
}
/** Team within an organization */
export interface Team {
    id: string;
    orgId: string;
    name: string;
    slug: string;
    description?: string;
    permission: "read" | "write" | "admin";
    createdAt: string;
}
/** Organization membership */
export interface OrgMember {
    id: string;
    orgId: string;
    userId: string;
    role: "member" | "admin" | "owner";
    createdAt: string;
}
/** Team membership */
export interface TeamMember {
    id: string;
    teamId: string;
    userId: string;
    createdAt: string;
}
//# sourceMappingURL=user.d.ts.map