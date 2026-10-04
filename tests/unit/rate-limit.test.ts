import { afterEach, describe, expect, it, vi } from "vitest";
import { enforceRateLimit, getClientIp, rateLimit } from "@/lib/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

describe("rateLimit", () => {
  it("allows up to the limit within a window, then blocks", () => {
    const key = `test:${crypto.randomUUID()}`;
    expect(rateLimit(key, 2, 60_000).success).toBe(true);
    expect(rateLimit(key, 2, 60_000).success).toBe(true);

    const blocked = rateLimit(key, 2, 60_000);
    expect(blocked.success).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(60);
  });

  it("starts a new window once the old one expires", () => {
    vi.useFakeTimers();
    const key = `test:${crypto.randomUUID()}`;
    rateLimit(key, 1, 1_000);
    expect(rateLimit(key, 1, 1_000).success).toBe(false);

    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, 1, 1_000).success).toBe(true);
  });

  it("keeps keys independent", () => {
    const a = `test:${crypto.randomUUID()}`;
    const b = `test:${crypto.randomUUID()}`;
    rateLimit(a, 1, 60_000);
    expect(rateLimit(a, 1, 60_000).success).toBe(false);
    expect(rateLimit(b, 1, 60_000).success).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("throws a 429 with Retry-After once over the limit", () => {
    const key = `test:${crypto.randomUUID()}`;
    enforceRateLimit(key, 1, 60_000);
    expect(() => enforceRateLimit(key, 1, 60_000)).toThrow(
      expect.objectContaining({
        status: 429,
        headers: { "Retry-After": expect.any(String) },
      }),
    );
  });
});

describe("getClientIp", () => {
  it("uses the first x-forwarded-for address", () => {
    const headers = new Headers({ "x-forwarded-for": "1.2.3.4, 10.0.0.1" });
    expect(getClientIp(headers)).toBe("1.2.3.4");
  });

  it("falls back to x-real-ip, then 'unknown'", () => {
    expect(getClientIp({ "x-real-ip": "5.6.7.8" })).toBe("5.6.7.8");
    expect(getClientIp(undefined)).toBe("unknown");
  });

  it("reads Node-style header records with array values", () => {
    expect(getClientIp({ "x-forwarded-for": ["9.9.9.9"] })).toBe("9.9.9.9");
  });
});
