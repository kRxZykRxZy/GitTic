import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { RateLimiter } from "../rate-limiter.js";

describe("RateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limit", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 3 });
    const r1 = limiter.check("key");
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    const r2 = limiter.check("key");
    expect(r2.allowed).toBe(true);
    expect(r2.remaining).toBe(1);

    const r3 = limiter.check("key");
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);
  });

  it("blocks requests over limit", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 2 });
    limiter.check("key");
    limiter.check("key");

    const result = limiter.check("key");
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks remaining count correctly", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 5 });
    expect(limiter.check("key").remaining).toBe(4);
    expect(limiter.check("key").remaining).toBe(3);
    expect(limiter.check("key").remaining).toBe(2);
    expect(limiter.check("key").remaining).toBe(1);
    expect(limiter.check("key").remaining).toBe(0);
  });

  it("resets after window expires", () => {
    const limiter = new RateLimiter({ windowMs: 1000, maxRequests: 1 });
    limiter.check("key");

    const blocked = limiter.check("key");
    expect(blocked.allowed).toBe(false);

    vi.advanceTimersByTime(1001);

    const allowed = limiter.check("key");
    expect(allowed.allowed).toBe(true);
  });

  it("tracks different keys independently", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    expect(limiter.check("b").allowed).toBe(false);
  });

  it("reset clears rate limit for a key", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.check("key");
    expect(limiter.check("key").allowed).toBe(false);

    limiter.reset("key");
    expect(limiter.check("key").allowed).toBe(true);
  });

  it("clear removes all entries", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 1 });
    limiter.check("a");
    limiter.check("b");
    limiter.clear();
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("retryAfterMs is 0 when allowed", () => {
    const limiter = new RateLimiter({ windowMs: 60_000, maxRequests: 5 });
    const result = limiter.check("key");
    expect(result.retryAfterMs).toBe(0);
  });
});
