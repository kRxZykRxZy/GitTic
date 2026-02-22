import { describe, it, expect } from "vitest";
import { hashPassword, comparePassword } from "../password.js";

describe("hashPassword", () => {
  it("returns a hash different from the plain password", async () => {
    const hash = await hashPassword("myPassword123");
    expect(hash).not.toBe("myPassword123");
    expect(hash.length).toBeGreaterThan(0);
  });

  it("produces different hashes for the same password", async () => {
    const hash1 = await hashPassword("samePassword");
    const hash2 = await hashPassword("samePassword");
    expect(hash1).not.toBe(hash2);
  });

  it("produces a bcrypt-format hash", async () => {
    const hash = await hashPassword("test");
    expect(hash).toMatch(/^\$2[aby]?\$/);
  });
});

describe("comparePassword", () => {
  it("returns true for correct password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await comparePassword("correctPassword", hash);
    expect(result).toBe(true);
  });

  it("returns false for wrong password", async () => {
    const hash = await hashPassword("correctPassword");
    const result = await comparePassword("wrongPassword", hash);
    expect(result).toBe(false);
  });

  it("returns false for empty password against a hash", async () => {
    const hash = await hashPassword("somePassword");
    const result = await comparePassword("", hash);
    expect(result).toBe(false);
  });

  it("handles special characters in passwords", async () => {
    const password = "p@$$w0rd!#%^&*()";
    const hash = await hashPassword(password);
    expect(await comparePassword(password, hash)).toBe(true);
    expect(await comparePassword("p@$$w0rd", hash)).toBe(false);
  });

  it("handles unicode passwords", async () => {
    const password = "пароль密码パスワード";
    const hash = await hashPassword(password);
    expect(await comparePassword(password, hash)).toBe(true);
  });
});
