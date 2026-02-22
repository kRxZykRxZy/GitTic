import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import Database from "better-sqlite3";

/**
 * Test suite for repository database operations.
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
  createRepository,
  getRepository,
  getRepositoryBySlug,
  updateRepository,
  deleteRepository,
} = await import("../repository-model.js");

import type { CreateRepositoryInput, UpdateRepositoryInput } from "../repository-model.js";

/**
 * Setup in-memory database with schema before each test
 */
beforeEach(() => {
  testDb = new Database(":memory:");
  
  // Create repositories table
  testDb.exec(`
    CREATE TABLE repositories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      org_id TEXT,
      visibility TEXT NOT NULL DEFAULT 'public',
      default_branch TEXT NOT NULL DEFAULT 'main',
      has_issues INTEGER NOT NULL DEFAULT 1,
      has_projects INTEGER NOT NULL DEFAULT 1,
      has_wiki INTEGER NOT NULL DEFAULT 1,
      allow_merge_commit INTEGER NOT NULL DEFAULT 1,
      allow_squash_merge INTEGER NOT NULL DEFAULT 1,
      allow_rebase_merge INTEGER NOT NULL DEFAULT 1,
      delete_branch_on_merge INTEGER NOT NULL DEFAULT 0,
      archived INTEGER NOT NULL DEFAULT 0,
      disabled INTEGER NOT NULL DEFAULT 0,
      storage_path TEXT NOT NULL,
      star_count INTEGER NOT NULL DEFAULT 0,
      fork_count INTEGER NOT NULL DEFAULT 0,
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

describe("createRepository", () => {
  it("creates repository with required fields", () => {
    const input: CreateRepositoryInput = {
      name: "test-repo",
      slug: "test-repo",
      ownerId: "user-123",
      storagePath: "/repos/user-123/test-repo",
    };

    const repo = createRepository(input);

    expect(repo).toBeDefined();
    expect(repo.id).toBeDefined();
    expect(repo.name).toBe("test-repo");
    expect(repo.slug).toBe("test-repo");
    expect(repo.ownerId).toBe("user-123");
    expect(repo.visibility).toBe("public");
    expect(repo.defaultBranch).toBe("main");
  });

  it("creates repository with optional fields", () => {
    const input: CreateRepositoryInput = {
      name: "my-project",
      slug: "my-project",
      description: "My awesome project",
      ownerId: "user-456",
      orgId: "org-789",
      visibility: "private",
      defaultBranch: "develop",
      storagePath: "/repos/org-789/my-project",
    };

    const repo = createRepository(input);

    expect(repo.description).toBe("My awesome project");
    expect(repo.orgId).toBe("org-789");
    expect(repo.visibility).toBe("private");
    expect(repo.defaultBranch).toBe("develop");
  });

  it("sets timestamps on creation", () => {
    const input: CreateRepositoryInput = {
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    };

    const repo = createRepository(input);

    expect(repo.createdAt).toBeDefined();
    expect(repo.updatedAt).toBeDefined();
    expect(new Date(repo.createdAt)).toBeInstanceOf(Date);
  });

  it("sets default values for boolean fields", () => {
    const input: CreateRepositoryInput = {
      name: "defaults-test",
      slug: "defaults-test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    };

    const repo = createRepository(input);

    expect(repo.hasIssues).toBe(true);
    expect(repo.hasProjects).toBe(true);
    expect(repo.hasWiki).toBe(true);
    expect(repo.allowMergeCommit).toBe(true);
    expect(repo.allowSquashMerge).toBe(true);
    expect(repo.allowRebaseMerge).toBe(true);
    expect(repo.deleteBranchOnMerge).toBe(false);
    expect(repo.archived).toBe(false);
    expect(repo.disabled).toBe(false);
  });

  it("initializes counters to zero", () => {
    const input: CreateRepositoryInput = {
      name: "counter-test",
      slug: "counter-test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    };

    const repo = createRepository(input);

    expect(repo.starCount).toBe(0);
    expect(repo.forkCount).toBe(0);
  });
});

describe("getRepository", () => {
  it("retrieves repository by ID", () => {
    const input: CreateRepositoryInput = {
      name: "findme",
      slug: "findme",
      ownerId: "user-1",
      storagePath: "/repos/findme",
    };

    const created = createRepository(input);
    const found = getRepository(created.id);

    expect(found).toBeDefined();
    expect(found!.id).toBe(created.id);
    expect(found!.name).toBe("findme");
  });

  it("returns null for non-existent ID", () => {
    const result = getRepository("non-existent-id");
    expect(result).toBeNull();
  });

  it("retrieves repository with all fields", () => {
    const input: CreateRepositoryInput = {
      name: "full-repo",
      slug: "full-repo",
      description: "Complete repository",
      ownerId: "user-1",
      orgId: "org-1",
      visibility: "internal",
      defaultBranch: "development",
      storagePath: "/repos/full",
    };

    const created = createRepository(input);
    const found = getRepository(created.id);

    expect(found!.description).toBe("Complete repository");
    expect(found!.orgId).toBe("org-1");
    expect(found!.visibility).toBe("internal");
    expect(found!.defaultBranch).toBe("development");
  });
});

describe("getRepositoryBySlug", () => {
  it("retrieves repository by owner and slug", () => {
    const input: CreateRepositoryInput = {
      name: "my-repo",
      slug: "my-repo",
      ownerId: "owner-123",
      storagePath: "/repos/my-repo",
    };

    createRepository(input);
    const found = getRepositoryBySlug("owner-123", "my-repo");

    expect(found).toBeDefined();
    expect(found!.slug).toBe("my-repo");
    expect(found!.ownerId).toBe("owner-123");
  });

  it("returns null when slug not found", () => {
    const result = getRepositoryBySlug("owner-123", "non-existent");
    expect(result).toBeNull();
  });

  it("returns null when owner mismatch", () => {
    const input: CreateRepositoryInput = {
      name: "test",
      slug: "test",
      ownerId: "owner-1",
      storagePath: "/repos/test",
    };

    createRepository(input);
    const result = getRepositoryBySlug("different-owner", "test");
    expect(result).toBeNull();
  });
});

describe("updateRepository", () => {
  it("updates repository name", () => {
    const input: CreateRepositoryInput = {
      name: "old-name",
      slug: "old-slug",
      ownerId: "user-1",
      storagePath: "/repos/test",
    };

    const created = createRepository(input);
    const updated = updateRepository(created.id, { name: "new-name" });

    expect(updated).toBeDefined();
    expect(updated!.name).toBe("new-name");
    expect(updated!.slug).toBe("old-slug"); // slug unchanged
  });

  it("updates repository description", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const updated = updateRepository(created.id, {
      description: "New description",
    });

    expect(updated!.description).toBe("New description");
  });

  it("updates repository visibility", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const updated = updateRepository(created.id, { visibility: "private" });

    expect(updated!.visibility).toBe("private");
  });

  it("updates boolean settings", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const updated = updateRepository(created.id, {
      hasIssues: false,
      hasWiki: false,
      archived: true,
    });

    expect(updated!.hasIssues).toBe(false);
    expect(updated!.hasWiki).toBe(false);
    expect(updated!.archived).toBe(true);
  });

  it("updates merge settings", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const updated = updateRepository(created.id, {
      allowMergeCommit: false,
      allowSquashMerge: false,
      allowRebaseMerge: false,
      deleteBranchOnMerge: true,
    });

    expect(updated!.allowMergeCommit).toBe(false);
    expect(updated!.allowSquashMerge).toBe(false);
    expect(updated!.allowRebaseMerge).toBe(false);
    expect(updated!.deleteBranchOnMerge).toBe(true);
  });

  it("updates timestamp on update", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const originalUpdatedAt = created.updatedAt;
    
    // Small delay to ensure timestamp difference
    const updated = updateRepository(created.id, { name: "updated" });

    expect(updated!.updatedAt).toBeDefined();
    // Updated timestamp should be same or later
    expect(new Date(updated!.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(originalUpdatedAt).getTime()
    );
  });

  it("returns null for non-existent repository", () => {
    const result = updateRepository("non-existent", { name: "test" });
    expect(result).toBeNull();
  });

  it("returns unchanged repository when no updates provided", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const updated = updateRepository(created.id, {});

    expect(updated).toBeDefined();
    expect(updated!.name).toBe("test");
  });

  it("updates multiple fields at once", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    const updated = updateRepository(created.id, {
      name: "new-name",
      description: "new description",
      visibility: "private",
      defaultBranch: "develop",
      hasIssues: false,
    });

    expect(updated!.name).toBe("new-name");
    expect(updated!.description).toBe("new description");
    expect(updated!.visibility).toBe("private");
    expect(updated!.defaultBranch).toBe("develop");
    expect(updated!.hasIssues).toBe(false);
  });
});

describe("deleteRepository", () => {
  it("deletes existing repository", () => {
    const created = createRepository({
      name: "to-delete",
      slug: "to-delete",
      ownerId: "user-1",
      storagePath: "/repos/to-delete",
    });

    const deleted = deleteRepository(created.id);
    expect(deleted).toBe(true);

    const found = getRepository(created.id);
    expect(found).toBeNull();
  });

  it("returns false for non-existent repository", () => {
    const result = deleteRepository("non-existent-id");
    expect(result).toBe(false);
  });

  it("removes repository from database permanently", () => {
    const created = createRepository({
      name: "test",
      slug: "test",
      ownerId: "user-1",
      storagePath: "/repos/test",
    });

    deleteRepository(created.id);
    
    // Verify it's truly gone
    const found = getRepository(created.id);
    expect(found).toBeNull();
  });
});
