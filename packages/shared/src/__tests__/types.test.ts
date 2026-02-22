import { describe, it, expect } from "vitest";
import type {
  RepositoryVisibility,
  CollaboratorPermission,
  RepositorySettings,
  Collaborator,
  CollaboratorPermissions,
} from "../types/repository.js";
import type { Organization, OrganizationRole, Team } from "../types/organization.js";
import type { User, UserRole } from "../types/index.js";

/**
 * Test suite for shared type definitions.
 * Ensures that types are properly exported and structured.
 */

describe("Repository Types", () => {
  it("defines valid RepositoryVisibility values", () => {
    const visibilities: RepositoryVisibility[] = ["public", "private", "internal"];
    
    visibilities.forEach((visibility) => {
      expect(["public", "private", "internal"]).toContain(visibility);
    });
  });

  it("defines valid CollaboratorPermission values", () => {
    const permissions: CollaboratorPermission[] = [
      "pull",
      "triage",
      "push",
      "maintain",
      "admin",
    ];
    
    permissions.forEach((permission) => {
      expect(["pull", "triage", "push", "maintain", "admin"]).toContain(permission);
    });
  });

  it("creates valid RepositorySettings object", () => {
    const settings: RepositorySettings = {
      name: "test-repo",
      description: "A test repository",
      visibility: "public",
      defaultBranch: "main",
      hasIssues: true,
      hasProjects: false,
      hasWiki: true,
      allowMergeCommit: true,
      allowSquashMerge: true,
      allowRebaseMerge: false,
      deleteBranchOnMerge: true,
      archived: false,
      disabled: false,
    };

    expect(settings.name).toBe("test-repo");
    expect(settings.visibility).toBe("public");
    expect(settings.defaultBranch).toBe("main");
    expect(settings.hasIssues).toBe(true);
  });

  it("creates valid Collaborator object", () => {
    const collaborator: Collaborator = {
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
      avatarUrl: "https://example.com/avatar.png",
      role: "push",
      permissions: {
        admin: false,
        maintain: false,
        push: true,
        triage: true,
        pull: true,
      },
      addedAt: "2024-01-01T00:00:00Z",
    };

    expect(collaborator.id).toBe("user-123");
    expect(collaborator.role).toBe("push");
    expect(collaborator.permissions.push).toBe(true);
    expect(collaborator.permissions.admin).toBe(false);
  });

  it("creates valid CollaboratorPermissions object", () => {
    const permissions: CollaboratorPermissions = {
      admin: true,
      maintain: true,
      push: true,
      triage: true,
      pull: true,
    };

    expect(permissions.admin).toBe(true);
    expect(permissions.pull).toBe(true);
  });
});

describe("Organization Types", () => {
  it("defines valid OrganizationRole values", () => {
    const roles: OrganizationRole[] = ["owner", "admin", "member"];
    
    roles.forEach((role) => {
      expect(["owner", "admin", "member"]).toContain(role);
    });
  });

  it("creates valid Organization object", () => {
    const org: Organization = {
      id: "org-123",
      login: "test-org",
      name: "Test Organization",
      description: "A test organization",
      avatarUrl: "https://example.com/org.png",
      email: "contact@test-org.com",
      location: "San Francisco, CA",
      website: "https://test-org.com",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
      publicRepos: 10,
      privateRepos: 5,
      totalRepos: 15,
      members: 25,
    };

    expect(org.login).toBe("test-org");
    expect(org.totalRepos).toBe(15);
    expect(org.members).toBe(25);
  });

  it("creates valid Team object", () => {
    const team: Team = {
      id: "team-123",
      name: "Engineering",
      slug: "engineering",
      description: "Engineering team",
      privacy: "closed",
      permission: "push",
      membersCount: 10,
      reposCount: 5,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    expect(team.name).toBe("Engineering");
    expect(team.privacy).toBe("closed");
    expect(team.membersCount).toBe(10);
  });
});

describe("User Types", () => {
  it("defines valid UserRole values", () => {
    const roles: UserRole[] = ["user", "moderator", "admin"];
    
    roles.forEach((role) => {
      expect(["user", "moderator", "admin"]).toContain(role);
    });
  });

  it("creates valid User object", () => {
    const user: User = {
      id: "user-123",
      username: "testuser",
      email: "test@example.com",
      passwordHash: "$2b$10$...",
      role: "user",
      displayName: "Test User",
      avatarUrl: "https://example.com/avatar.png",
      bio: "Software developer",
      suspended: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    expect(user.username).toBe("testuser");
    expect(user.role).toBe("user");
    expect(user.suspended).toBe(false);
  });

  it("creates User with optional fields omitted", () => {
    const user: User = {
      id: "user-456",
      username: "minimaluser",
      email: "minimal@example.com",
      passwordHash: "$2b$10$...",
      role: "user",
      suspended: false,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T00:00:00Z",
    };

    expect(user.displayName).toBeUndefined();
    expect(user.bio).toBeUndefined();
    expect(user.avatarUrl).toBeUndefined();
  });
});
