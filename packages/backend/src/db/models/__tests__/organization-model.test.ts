import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";

/**
 * Test suite for organization database operations.
 * Uses in-memory SQLite for isolated testing.
 */

let testDb: Database.Database;

// Mock the connection module
vi.mock("../../connection.js", () => ({
  getDb: () => testDb,
  closeDb: vi.fn(),
  withTransaction: vi.fn((fn) => fn()),
}));

// Import after mocking
const {
  createOrg,
  getOrg,
  getOrgByLogin,
  updateOrg,
  deleteOrg,
  addMember,
  removeMember,
  getMembers,
  getMemberRole,
  updateMemberRole,
} = await import("../organization-model.js");

import type { CreateOrgInput, UpdateOrgInput } from "../organization-model.js";

/**
 * Setup in-memory database with schema before each test
 */
beforeEach(() => {
  testDb = new Database(":memory:");
  
  // Create organizations table
  testDb.exec(`
    CREATE TABLE organizations (
      id TEXT PRIMARY KEY,
      login TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      avatar_url TEXT,
      email TEXT,
      location TEXT,
      website TEXT,
      owner_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE org_members (
      org_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TEXT NOT NULL,
      PRIMARY KEY (org_id, user_id)
    );

    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'public',
      created_at TEXT NOT NULL
    );
  `);

  // Create test users
  testDb.exec(`
    INSERT INTO users (id, username, email, password_hash, created_at, updated_at)
    VALUES 
      ('user-1', 'owner', 'owner@example.com', '$2b$10$hash', '2024-01-01', '2024-01-01'),
      ('user-2', 'member1', 'member1@example.com', '$2b$10$hash', '2024-01-01', '2024-01-01'),
      ('user-3', 'member2', 'member2@example.com', '$2b$10$hash', '2024-01-01', '2024-01-01');
  `);
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  testDb.close();
});

describe("createOrg", () => {
  it("creates organization with required fields", () => {
    const input: CreateOrgInput = {
      login: "test-org",
      name: "Test Organization",
      ownerId: "user-1",
    };

    const org = createOrg(input);

    expect(org).toBeDefined();
    expect(org.id).toBeDefined();
    expect(org.login).toBe("test-org");
    expect(org.name).toBe("Test Organization");
    expect(org.members).toBe(1); // Owner is automatically added
  });

  it("creates organization with optional fields", () => {
    const input: CreateOrgInput = {
      login: "full-org",
      name: "Full Organization",
      description: "A complete organization",
      email: "contact@org.com",
      ownerId: "user-1",
    };

    const org = createOrg(input);

    expect(org.description).toBe("A complete organization");
    expect(org.email).toBe("contact@org.com");
  });

  it("sets timestamps on creation", () => {
    const input: CreateOrgInput = {
      login: "time-org",
      name: "Time Org",
      ownerId: "user-1",
    };

    const org = createOrg(input);

    expect(org.createdAt).toBeDefined();
    expect(org.updatedAt).toBeDefined();
    expect(new Date(org.createdAt)).toBeInstanceOf(Date);
  });

  it("automatically adds owner as member", () => {
    const input: CreateOrgInput = {
      login: "owner-org",
      name: "Owner Org",
      ownerId: "user-1",
    };

    const org = createOrg(input);
    const members = getMembers(org.id);

    expect(members).toHaveLength(1);
    expect(members[0].id).toBe("user-1");
    expect(members[0].role).toBe("owner");
  });

  it("initializes with zero repositories", () => {
    const input: CreateOrgInput = {
      login: "repo-org",
      name: "Repo Org",
      ownerId: "user-1",
    };

    const org = createOrg(input);

    expect(org.publicRepos).toBe(0);
    expect(org.privateRepos).toBe(0);
    expect(org.totalRepos).toBe(0);
  });
});

describe("getOrg", () => {
  it("retrieves organization by ID", () => {
    const input: CreateOrgInput = {
      login: "find-org",
      name: "Find Org",
      ownerId: "user-1",
    };

    const created = createOrg(input);
    const found = getOrg(created.id);

    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
    expect(found!.login).toBe("find-org");
  });

  it("returns null for non-existent ID", () => {
    const result = getOrg("non-existent-id");
    expect(result).toBeNull();
  });

  it("includes organization statistics", () => {
    const input: CreateOrgInput = {
      login: "stats-org",
      name: "Stats Org",
      ownerId: "user-1",
    };

    const created = createOrg(input);
    const found = getOrg(created.id);

    expect(found!.members).toBeDefined();
    expect(found!.publicRepos).toBeDefined();
    expect(found!.privateRepos).toBeDefined();
    expect(found!.totalRepos).toBeDefined();
  });
});

describe("getOrgByLogin", () => {
  it("retrieves organization by exact login", () => {
    const input: CreateOrgInput = {
      login: "exact-login",
      name: "Exact Login Org",
      ownerId: "user-1",
    };

    createOrg(input);
    const found = getOrgByLogin("exact-login");

    expect(found).toBeDefined();
    expect(found!.login).toBe("exact-login");
  });

  it("retrieves organization case-insensitively", () => {
    const input: CreateOrgInput = {
      login: "CaseSensitive",
      name: "Case Org",
      ownerId: "user-1",
    };

    createOrg(input);
    
    expect(getOrgByLogin("casesensitive")).toBeDefined();
    expect(getOrgByLogin("CASESENSITIVE")).toBeDefined();
    expect(getOrgByLogin("CaseSensitive")).toBeDefined();
  });

  it("returns null for non-existent login", () => {
    const result = getOrgByLogin("nonexistent");
    expect(result).toBeNull();
  });
});

describe("updateOrg", () => {
  it("updates organization name", () => {
    const created = createOrg({
      login: "update-org",
      name: "Old Name",
      ownerId: "user-1",
    });

    const updated = updateOrg(created.id, { name: "New Name" });

    expect(updated).toBeDefined();
    expect(updated!.name).toBe("New Name");
    expect(updated!.login).toBe("update-org"); // login unchanged
  });

  it("updates organization description", () => {
    const created = createOrg({
      login: "desc-org",
      name: "Desc Org",
      ownerId: "user-1",
    });

    const updated = updateOrg(created.id, {
      description: "New description",
    });

    expect(updated!.description).toBe("New description");
  });

  it("updates organization email", () => {
    const created = createOrg({
      login: "email-org",
      name: "Email Org",
      ownerId: "user-1",
    });

    const updated = updateOrg(created.id, { email: "new@example.com" });

    expect(updated!.email).toBe("new@example.com");
  });

  it("updates location and website", () => {
    const created = createOrg({
      login: "location-org",
      name: "Location Org",
      ownerId: "user-1",
    });

    const updated = updateOrg(created.id, {
      location: "San Francisco, CA",
      website: "https://example.com",
    });

    expect(updated!.location).toBe("San Francisco, CA");
    expect(updated!.website).toBe("https://example.com");
  });

  it("updates avatar URL", () => {
    const created = createOrg({
      login: "avatar-org",
      name: "Avatar Org",
      ownerId: "user-1",
    });

    const updated = updateOrg(created.id, {
      avatarUrl: "https://example.com/org-avatar.png",
    });

    expect(updated!.avatarUrl).toBe("https://example.com/org-avatar.png");
  });

  it("updates timestamp on update", () => {
    const created = createOrg({
      login: "time-org",
      name: "Time Org",
      ownerId: "user-1",
    });

    const originalUpdatedAt = created.updatedAt;
    const updated = updateOrg(created.id, { name: "Updated" });

    expect(updated!.updatedAt).toBeDefined();
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it("returns null for non-existent organization", () => {
    const result = updateOrg("non-existent", { name: "Test" });
    expect(result).toBeNull();
  });

  it("updates multiple fields at once", () => {
    const created = createOrg({
      login: "multi-org",
      name: "Multi Org",
      ownerId: "user-1",
    });

    const updated = updateOrg(created.id, {
      name: "Updated Name",
      description: "Updated description",
      email: "updated@example.com",
      location: "New York, NY",
    });

    expect(updated!.name).toBe("Updated Name");
    expect(updated!.description).toBe("Updated description");
    expect(updated!.email).toBe("updated@example.com");
    expect(updated!.location).toBe("New York, NY");
  });
});

describe("deleteOrg", () => {
  it("deletes existing organization", () => {
    const created = createOrg({
      login: "delete-org",
      name: "Delete Org",
      ownerId: "user-1",
    });

    const deleted = deleteOrg(created.id);
    expect(deleted).toBe(true);

    const found = getOrg(created.id);
    expect(found).toBeNull();
  });

  it("returns false for non-existent organization", () => {
    const result = deleteOrg("non-existent-id");
    expect(result).toBe(false);
  });
});

describe("addMember", () => {
  it("adds member with default role", () => {
    const org = createOrg({
      login: "member-org",
      name: "Member Org",
      ownerId: "user-1",
    });

    const added = addMember(org.id, "user-2");
    expect(added).toBe(true);

    const members = getMembers(org.id);
    expect(members).toHaveLength(2); // Owner + new member
    
    const newMember = members.find((m) => m.id === "user-2");
    expect(newMember).toBeDefined();
    expect(newMember!.role).toBe("member");
  });

  it("adds member with specific role", () => {
    const org = createOrg({
      login: "owner-org",
      name: "Owner Org",
      ownerId: "user-1",
    });

    const added = addMember(org.id, "user-2", "owner");
    expect(added).toBe(true);

    const role = getMemberRole(org.id, "user-2");
    expect(role).toBe("owner");
  });

  it("returns false when adding duplicate member", () => {
    const org = createOrg({
      login: "dup-org",
      name: "Duplicate Org",
      ownerId: "user-1",
    });

    addMember(org.id, "user-2");
    const result = addMember(org.id, "user-2");
    
    expect(result).toBe(false);
  });
});

describe("removeMember", () => {
  it("removes existing member", () => {
    const org = createOrg({
      login: "remove-org",
      name: "Remove Org",
      ownerId: "user-1",
    });

    addMember(org.id, "user-2");
    const removed = removeMember(org.id, "user-2");
    
    expect(removed).toBe(true);
    
    const members = getMembers(org.id);
    expect(members).toHaveLength(1); // Only owner remains
    expect(members[0].id).toBe("user-1");
  });

  it("returns false for non-existent member", () => {
    const org = createOrg({
      login: "noremove-org",
      name: "No Remove Org",
      ownerId: "user-1",
    });

    const result = removeMember(org.id, "user-999");
    expect(result).toBe(false);
  });
});

describe("getMembers", () => {
  it("returns all organization members", () => {
    const org = createOrg({
      login: "list-org",
      name: "List Org",
      ownerId: "user-1",
    });

    addMember(org.id, "user-2");
    addMember(org.id, "user-3");

    const members = getMembers(org.id);

    expect(members).toHaveLength(3);
    expect(members.map((m) => m.id)).toContain("user-1");
    expect(members.map((m) => m.id)).toContain("user-2");
    expect(members.map((m) => m.id)).toContain("user-3");
  });

  it("returns empty array for organization with no members", () => {
    testDb.exec(`
      INSERT INTO organizations (id, login, name, owner_id, created_at, updated_at)
      VALUES ('org-empty', 'empty', 'Empty Org', 'user-1', '2024-01-01', '2024-01-01')
    `);

    const members = getMembers("org-empty");
    expect(members).toEqual([]);
  });

  it("includes member details", () => {
    const org = createOrg({
      login: "detail-org",
      name: "Detail Org",
      ownerId: "user-1",
    });

    const members = getMembers(org.id);

    expect(members[0].id).toBeDefined();
    expect(members[0].username).toBeDefined();
    expect(members[0].role).toBeDefined();
    expect(members[0].joinedAt).toBeDefined();
  });
});

describe("getMemberRole", () => {
  it("returns member role", () => {
    const org = createOrg({
      login: "role-org",
      name: "Role Org",
      ownerId: "user-1",
    });

    const role = getMemberRole(org.id, "user-1");
    expect(role).toBe("owner");
  });

  it("returns null for non-member", () => {
    const org = createOrg({
      login: "norole-org",
      name: "No Role Org",
      ownerId: "user-1",
    });

    const role = getMemberRole(org.id, "user-999");
    expect(role).toBeNull();
  });
});

describe("updateMemberRole", () => {
  it("updates member role", () => {
    const org = createOrg({
      login: "updaterole-org",
      name: "Update Role Org",
      ownerId: "user-1",
    });

    addMember(org.id, "user-2", "member");
    const updated = updateMemberRole(org.id, "user-2", "owner");

    expect(updated).toBe(true);
    
    const role = getMemberRole(org.id, "user-2");
    expect(role).toBe("owner");
  });

  it("returns false for non-existent member", () => {
    const org = createOrg({
      login: "norole-org",
      name: "No Role Org",
      ownerId: "user-1",
    });

    const result = updateMemberRole(org.id, "user-999", "owner");
    expect(result).toBe(false);
  });
});

describe("Organization statistics", () => {
  it("counts public and private repositories", () => {
    const org = createOrg({
      login: "stats-org",
      name: "Stats Org",
      ownerId: "user-1",
    });

    // Add some repositories
    testDb.exec(`
      INSERT INTO repositories (id, name, org_id, visibility, created_at)
      VALUES 
        ('repo-1', 'repo1', '${org.id}', 'public', '2024-01-01'),
        ('repo-2', 'repo2', '${org.id}', 'public', '2024-01-01'),
        ('repo-3', 'repo3', '${org.id}', 'private', '2024-01-01');
    `);

    const found = getOrg(org.id);

    expect(found!.publicRepos).toBe(2);
    expect(found!.privateRepos).toBe(1);
    expect(found!.totalRepos).toBe(3);
  });

  it("counts members correctly", () => {
    const org = createOrg({
      login: "count-org",
      name: "Count Org",
      ownerId: "user-1",
    });

    addMember(org.id, "user-2");
    addMember(org.id, "user-3");

    const found = getOrg(org.id);
    expect(found!.members).toBe(3);
  });
});
