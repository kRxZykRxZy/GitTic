import { describe, it, expect } from "vitest";
import { generateToken, verifyToken, decodeToken } from "../jwt.js";

const SECRET = "test-secret-key-for-testing-only";

describe("generateToken", () => {
  it("returns a string token", () => {
    const token = generateToken(
      { userId: "1", username: "alice", role: "user" },
      SECRET
    );
    expect(typeof token).toBe("string");
    expect(token.split(".")).toHaveLength(3);
  });

  it("produces different tokens for different payloads", () => {
    const t1 = generateToken({ userId: "1", username: "alice", role: "user" }, SECRET);
    const t2 = generateToken({ userId: "2", username: "bob", role: "admin" }, SECRET);
    expect(t1).not.toBe(t2);
  });
});

describe("verifyToken", () => {
  it("valid token roundtrip preserves payload fields", () => {
    const token = generateToken(
      { userId: "42", username: "testuser", role: "moderator" },
      SECRET
    );
    const payload = verifyToken(token, SECRET);
    expect(payload.userId).toBe("42");
    expect(payload.username).toBe("testuser");
    expect(payload.role).toBe("moderator");
  });

  it("includes iat and exp fields", () => {
    const token = generateToken(
      { userId: "1", username: "alice", role: "user" },
      SECRET
    );
    const payload = verifyToken(token, SECRET);
    expect(payload.iat).toBeDefined();
    expect(payload.exp).toBeDefined();
    expect(typeof payload.iat).toBe("number");
    expect(typeof payload.exp).toBe("number");
  });

  it("fails with wrong secret", () => {
    const token = generateToken(
      { userId: "1", username: "alice", role: "user" },
      SECRET
    );
    expect(() => verifyToken(token, "wrong-secret")).toThrow();
  });

  it("fails with invalid token string", () => {
    expect(() => verifyToken("not.a.valid.token", SECRET)).toThrow();
  });

  it("fails with tampered token", () => {
    const token = generateToken(
      { userId: "1", username: "alice", role: "user" },
      SECRET
    );
    const tampered = token.slice(0, -5) + "XXXXX";
    expect(() => verifyToken(tampered, SECRET)).toThrow();
  });

  it("expired token fails verification", () => {
    const token = generateToken(
      { userId: "1", username: "alice", role: "user" },
      SECRET,
      "0s"
    );
    expect(() => verifyToken(token, SECRET)).toThrow();
  });
});

describe("decodeToken", () => {
  it("decodes token without verification", () => {
    const token = generateToken(
      { userId: "1", username: "test", role: "user" },
      SECRET
    );
    const decoded = decodeToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe("1");
    expect(decoded?.username).toBe("test");
  });

  it("returns null for invalid token", () => {
    expect(decodeToken("garbage")).toBeNull();
  });
});
