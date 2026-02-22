import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidUsername,
  isValidRepoName,
  isValidBranchName,
  isStrongPassword,
} from "../validation.js";

describe("isValidEmail", () => {
  it("accepts valid emails", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("test.user@domain.org")).toBe(true);
    expect(isValidEmail("a+b@c.io")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("user")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@")).toBe(false);
    expect(isValidEmail("user@domain")).toBe(false);
    expect(isValidEmail("user @domain.com")).toBe(false);
  });
});

describe("isValidUsername", () => {
  it("accepts valid usernames", () => {
    expect(isValidUsername("alice")).toBe(true);
    expect(isValidUsername("bob-smith")).toBe(true);
    expect(isValidUsername("user123")).toBe(true);
    expect(isValidUsername("ab1")).toBe(true);
  });

  it("rejects usernames starting or ending with hyphen", () => {
    expect(isValidUsername("-alice")).toBe(false);
    expect(isValidUsername("alice-")).toBe(false);
  });

  it("rejects too short usernames", () => {
    expect(isValidUsername("ab")).toBe(false);
    expect(isValidUsername("")).toBe(false);
  });

  it("accepts single character username", () => {
    expect(isValidUsername("a")).toBe(true);
  });

  it("rejects too long usernames (>39 chars)", () => {
    expect(isValidUsername("a".repeat(40))).toBe(false);
  });

  it("rejects usernames with special characters", () => {
    expect(isValidUsername("user_name")).toBe(false);
    expect(isValidUsername("user.name")).toBe(false);
    expect(isValidUsername("user@name")).toBe(false);
  });
});

describe("isValidRepoName", () => {
  it("accepts valid repo names", () => {
    expect(isValidRepoName("my-repo")).toBe(true);
    expect(isValidRepoName("repo_v2")).toBe(true);
    expect(isValidRepoName("project.js")).toBe(true);
    expect(isValidRepoName("a")).toBe(true);
  });

  it("rejects names ending with .git", () => {
    expect(isValidRepoName("repo.git")).toBe(false);
  });

  it("rejects dot and double dot", () => {
    expect(isValidRepoName(".")).toBe(false);
    expect(isValidRepoName("..")).toBe(false);
  });

  it("rejects empty name", () => {
    expect(isValidRepoName("")).toBe(false);
  });

  it("rejects names starting with special chars", () => {
    expect(isValidRepoName("-repo")).toBe(false);
    expect(isValidRepoName(".repo")).toBe(false);
  });

  it("rejects names over 100 chars", () => {
    expect(isValidRepoName("a".repeat(101))).toBe(false);
  });
});

describe("isValidBranchName", () => {
  it("accepts valid branch names", () => {
    expect(isValidBranchName("main")).toBe(true);
    expect(isValidBranchName("feature/new-thing")).toBe(true);
  });

  it("rejects names with ..", () => {
    expect(isValidBranchName("a..b")).toBe(false);
  });
});

describe("isStrongPassword", () => {
  it("accepts strong passwords", () => {
    expect(isStrongPassword("Abcdefg1")).toBe(true);
  });

  it("rejects weak passwords", () => {
    expect(isStrongPassword("short1A")).toBe(false);
    expect(isStrongPassword("alllowercase1")).toBe(false);
    expect(isStrongPassword("ALLUPPERCASE1")).toBe(false);
    expect(isStrongPassword("NoDigitsHere")).toBe(false);
  });
});
