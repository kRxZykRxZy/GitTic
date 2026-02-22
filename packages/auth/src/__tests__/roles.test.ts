import { describe, it, expect } from "vitest";
import { hasRole, hasPermission, getPermissions } from "../roles.js";
import type { Permission } from "../roles.js";

describe("hasRole", () => {
  it("admin has admin role", () => {
    expect(hasRole("admin", "admin")).toBe(true);
  });

  it("admin has user role", () => {
    expect(hasRole("admin", "user")).toBe(true);
  });

  it("admin has moderator role", () => {
    expect(hasRole("admin", "moderator")).toBe(true);
  });

  it("moderator has user role", () => {
    expect(hasRole("moderator", "user")).toBe(true);
  });

  it("moderator has moderator role", () => {
    expect(hasRole("moderator", "moderator")).toBe(true);
  });

  it("moderator does NOT have admin role", () => {
    expect(hasRole("moderator", "admin")).toBe(false);
  });

  it("user has user role", () => {
    expect(hasRole("user", "user")).toBe(true);
  });

  it("user does NOT have moderator role", () => {
    expect(hasRole("user", "moderator")).toBe(false);
  });

  it("user does NOT have admin role", () => {
    expect(hasRole("user", "admin")).toBe(false);
  });
});

describe("hasPermission", () => {
  it("admin has admin:dashboard permission", () => {
    expect(hasPermission("admin", "admin:dashboard")).toBe(true);
  });

  it("admin has repo:delete permission", () => {
    expect(hasPermission("admin", "repo:delete")).toBe(true);
  });

  it("moderator has moderation:manage permission", () => {
    expect(hasPermission("moderator", "moderation:manage")).toBe(true);
  });

  it("moderator does NOT have admin:dashboard permission", () => {
    expect(hasPermission("moderator", "admin:dashboard")).toBe(false);
  });

  it("user has repo:read permission", () => {
    expect(hasPermission("user", "repo:read")).toBe(true);
  });

  it("user does NOT have repo:delete permission", () => {
    expect(hasPermission("user", "repo:delete")).toBe(false);
  });

  it("user does NOT have admin:dashboard permission", () => {
    expect(hasPermission("user", "admin:dashboard")).toBe(false);
  });

  it("user has pipeline:run permission", () => {
    expect(hasPermission("user", "pipeline:run")).toBe(true);
  });
});

describe("getPermissions", () => {
  it("admin has the most permissions", () => {
    const adminPerms = getPermissions("admin");
    const modPerms = getPermissions("moderator");
    const userPerms = getPermissions("user");
    expect(adminPerms.length).toBeGreaterThan(modPerms.length);
    expect(modPerms.length).toBeGreaterThan(userPerms.length);
  });

  it("user has basic permissions", () => {
    const perms = getPermissions("user");
    expect(perms).toContain("repo:read");
    expect(perms).toContain("repo:write");
    expect(perms).toContain("user:read");
  });

  it("returns an array", () => {
    expect(Array.isArray(getPermissions("admin"))).toBe(true);
    expect(Array.isArray(getPermissions("user"))).toBe(true);
  });

  it("moderator has analytics:read", () => {
    expect(getPermissions("moderator")).toContain("analytics:read");
  });

  it("admin has cluster:manage", () => {
    expect(getPermissions("admin")).toContain("cluster:manage");
  });
});
