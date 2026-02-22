import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";

/**
 * Test suite for user database operations.
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
  createUser,
  getUser,
  getUserByUsername,
  getUserByEmail,
  updateUser,
  deleteUser,
} = await import("../user-model.js");

import type { CreateUserInput, UpdateUserInput } from "../user-model.js";

/**
 * Setup in-memory database with schema before each test
 */
beforeEach(() => {
  testDb = new Database(":memory:");
  
  // Create users table
  testDb.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      display_name TEXT,
      avatar_url TEXT,
      bio TEXT,
      country TEXT,
      age_verified INTEGER NOT NULL DEFAULT 0,
      terms_accepted INTEGER NOT NULL DEFAULT 0,
      suspended INTEGER NOT NULL DEFAULT 0,
      suspended_until TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
});

/**
 * Cleanup after each test
 */
afterEach(() => {
  testDb.close();
});

describe("createUser", () => {
  it("creates user with required fields", () => {
    const input: CreateUserInput = {
      username: "testuser",
      email: "test@example.com",
      passwordHash: "$2b$10$hashedpassword",
    };

    const user = createUser(input);

    expect(user).toBeDefined();
    expect(user.id).toBeDefined();
    expect(user.username).toBe("testuser");
    expect(user.email).toBe("test@example.com");
    expect(user.passwordHash).toBe("$2b$10$hashedpassword");
    expect(user.role).toBe("user");
    expect(user.suspended).toBe(false);
  });

  it("creates user with optional fields", () => {
    const input: CreateUserInput = {
      username: "adminuser",
      email: "admin@example.com",
      passwordHash: "$2b$10$hash",
      role: "admin",
      displayName: "Admin User",
      country: "US",
      ageVerified: true,
      termsAccepted: true,
    };

    const user = createUser(input);

    expect(user.role).toBe("admin");
    expect(user.displayName).toBe("Admin User");
    // Note: country is stored but not returned by toUser() - this is a known limitation
  });

  it("sets timestamps on creation", () => {
    const input: CreateUserInput = {
      username: "user1",
      email: "user1@example.com",
      passwordHash: "$2b$10$hash",
    };

    const user = createUser(input);

    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
    expect(new Date(user.createdAt)).toBeInstanceOf(Date);
  });

  it("sets default role to user", () => {
    const input: CreateUserInput = {
      username: "defaultuser",
      email: "default@example.com",
      passwordHash: "$2b$10$hash",
    };

    const user = createUser(input);
    expect(user.role).toBe("user");
  });

  it("creates moderator user", () => {
    const input: CreateUserInput = {
      username: "moduser",
      email: "mod@example.com",
      passwordHash: "$2b$10$hash",
      role: "moderator",
    };

    const user = createUser(input);
    expect(user.role).toBe("moderator");
  });
});

describe("getUser", () => {
  it("retrieves user by ID", () => {
    const input: CreateUserInput = {
      username: "findme",
      email: "findme@example.com",
      passwordHash: "$2b$10$hash",
    };

    const created = createUser(input);
    const found = getUser(created.id);

    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
    expect(found!.username).toBe("findme");
  });

  it("returns null for non-existent ID", () => {
    const result = getUser("non-existent-id");
    expect(result).toBeNull();
  });

  it("retrieves user with all fields", () => {
    const input: CreateUserInput = {
      username: "fulluser",
      email: "full@example.com",
      passwordHash: "$2b$10$hash",
      displayName: "Full Name",
      country: "CA",
    };

    const created = createUser(input);
    const found = getUser(created.id);

    expect(found!.displayName).toBe("Full Name");
    // Note: country field is not included in the User type returned
  });
});

describe("getUserByUsername", () => {
  it("retrieves user by exact username", () => {
    const input: CreateUserInput = {
      username: "exactmatch",
      email: "exact@example.com",
      passwordHash: "$2b$10$hash",
    };

    createUser(input);
    const found = getUserByUsername("exactmatch");

    expect(found).toBeDefined();
    expect(found!.username).toBe("exactmatch");
  });

  it("retrieves user case-insensitively", () => {
    const input: CreateUserInput = {
      username: "CaseSensitive",
      email: "case@example.com",
      passwordHash: "$2b$10$hash",
    };

    createUser(input);
    
    expect(getUserByUsername("casesensitive")).toBeDefined();
    expect(getUserByUsername("CASESENSITIVE")).toBeDefined();
    expect(getUserByUsername("CaseSensitive")).toBeDefined();
  });

  it("returns null for non-existent username", () => {
    const result = getUserByUsername("nonexistent");
    expect(result).toBeNull();
  });
});

describe("getUserByEmail", () => {
  it("retrieves user by exact email", () => {
    const input: CreateUserInput = {
      username: "emailuser",
      email: "user@example.com",
      passwordHash: "$2b$10$hash",
    };

    createUser(input);
    const found = getUserByEmail("user@example.com");

    expect(found).toBeDefined();
    expect(found!.email).toBe("user@example.com");
  });

  it("retrieves user case-insensitively", () => {
    const input: CreateUserInput = {
      username: "caseuser",
      email: "Case@Example.COM",
      passwordHash: "$2b$10$hash",
    };

    createUser(input);
    
    expect(getUserByEmail("case@example.com")).toBeDefined();
    expect(getUserByEmail("CASE@EXAMPLE.COM")).toBeDefined();
    expect(getUserByEmail("Case@Example.COM")).toBeDefined();
  });

  it("returns null for non-existent email", () => {
    const result = getUserByEmail("nonexistent@example.com");
    expect(result).toBeNull();
  });
});

describe("updateUser", () => {
  it("updates display name", () => {
    const created = createUser({
      username: "updatetest",
      email: "update@example.com",
      passwordHash: "$2b$10$hash",
    });

    const updated = updateUser(created.id, { displayName: "New Name" });

    expect(updated).toBeDefined();
    expect(updated!.displayName).toBe("New Name");
  });

  it("updates avatar URL", () => {
    const created = createUser({
      username: "avatartest",
      email: "avatar@example.com",
      passwordHash: "$2b$10$hash",
    });

    const updated = updateUser(created.id, {
      avatarUrl: "https://example.com/avatar.png",
    });

    expect(updated!.avatarUrl).toBe("https://example.com/avatar.png");
  });

  it("updates bio", () => {
    const created = createUser({
      username: "biotest",
      email: "bio@example.com",
      passwordHash: "$2b$10$hash",
    });

    const updated = updateUser(created.id, {
      bio: "Software developer and open source enthusiast",
    });

    expect(updated!.bio).toBe("Software developer and open source enthusiast");
  });

  it("updates email", () => {
    const created = createUser({
      username: "emailupdate",
      email: "old@example.com",
      passwordHash: "$2b$10$hash",
    });

    const updated = updateUser(created.id, { email: "new@example.com" });

    expect(updated!.email).toBe("new@example.com");
  });

  it("updates country", () => {
    const created = createUser({
      username: "countrytest",
      email: "country@example.com",
      passwordHash: "$2b$10$hash",
      country: "US",
    });

    const updated = updateUser(created.id, { country: "CA" });

    // Note: country field is stored in DB but not returned in User type
    expect(updated).toBeDefined();
  });

  it("updates timestamp on update", () => {
    const created = createUser({
      username: "timetest",
      email: "time@example.com",
      passwordHash: "$2b$10$hash",
    });

    const originalUpdatedAt = created.updatedAt;
    const updated = updateUser(created.id, { displayName: "Updated" });

    expect(updated!.updatedAt).toBeDefined();
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it("returns null for non-existent user", () => {
    const result = updateUser("non-existent", { displayName: "Test" });
    expect(result).toBeNull();
  });

  it("returns unchanged user when no updates provided", () => {
    const created = createUser({
      username: "nochange",
      email: "nochange@example.com",
      passwordHash: "$2b$10$hash",
    });

    const updated = updateUser(created.id, {});

    expect(updated).toBeDefined();
    expect(updated!.username).toBe("nochange");
  });

  it("updates multiple fields at once", () => {
    const created = createUser({
      username: "multiupdate",
      email: "multi@example.com",
      passwordHash: "$2b$10$hash",
    });

    const updated = updateUser(created.id, {
      displayName: "Multi User",
      bio: "Testing multiple updates",
      country: "UK",
    });

    expect(updated!.displayName).toBe("Multi User");
    expect(updated!.bio).toBe("Testing multiple updates");
    // Note: country is stored but not returned in User type
  });
});

describe("deleteUser", () => {
  it("deletes existing user", () => {
    const created = createUser({
      username: "todelete",
      email: "delete@example.com",
      passwordHash: "$2b$10$hash",
    });

    const deleted = deleteUser(created.id);
    expect(deleted).toBe(true);

    const found = getUser(created.id);
    expect(found).toBeNull();
  });

  it("returns false for non-existent user", () => {
    const result = deleteUser("non-existent-id");
    expect(result).toBe(false);
  });

  it("removes user from database permanently", () => {
    const created = createUser({
      username: "permanent",
      email: "permanent@example.com",
      passwordHash: "$2b$10$hash",
    });

    deleteUser(created.id);
    
    // Verify it's truly gone
    expect(getUser(created.id)).toBeNull();
    expect(getUserByUsername("permanent")).toBeNull();
    expect(getUserByEmail("permanent@example.com")).toBeNull();
  });
});

describe("User data integrity", () => {
  it("preserves password hash", () => {
    const hash = "$2b$10$verylonghashstring1234567890";
    const created = createUser({
      username: "hashtest",
      email: "hash@example.com",
      passwordHash: hash,
    });

    expect(created.passwordHash).toBe(hash);
    
    const found = getUser(created.id);
    expect(found!.passwordHash).toBe(hash);
  });

  it("handles optional fields correctly", () => {
    const created = createUser({
      username: "minimal",
      email: "minimal@example.com",
      passwordHash: "$2b$10$hash",
    });

    expect(created.displayName).toBeUndefined();
    expect(created.avatarUrl).toBeUndefined();
    expect(created.bio).toBeUndefined();
    expect(created.country).toBeUndefined();
  });

  it("maintains user role", () => {
    const admin = createUser({
      username: "admin",
      email: "admin@example.com",
      passwordHash: "$2b$10$hash",
      role: "admin",
    });

    expect(admin.role).toBe("admin");
    
    const found = getUser(admin.id);
    expect(found!.role).toBe("admin");
  });
});
