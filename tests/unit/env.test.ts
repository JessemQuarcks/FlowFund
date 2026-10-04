import { describe, expect, it } from "vitest";
import { parseEnv } from "@/lib/env";

const valid = {
  DATABASE_URL: "mysql://user:pass@localhost:3306/flowfund",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "a-long-random-secret",
  GOOGLE_CLIENT_ID: "google-id",
  GOOGLE_CLIENT_SECRET: "google-secret",
  CLOUDINARY_CLOUD_NAME: "cloud",
  CLOUDINARY_API_KEY: "key",
  CLOUDINARY_API_SECRET: "secret",
  PAYSTACK_SECRET_KEY: "sk_test_abc",
  NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: "pk_test_abc",
};

describe("parseEnv", () => {
  it("accepts a complete environment", () => {
    const env = parseEnv(valid);
    expect(env.PAYSTACK_SECRET_KEY).toBe("sk_test_abc");
    expect(env.NODE_ENV).toBe("development");
  });

  it("treats empty strings as missing and lists every problem", () => {
    expect(() =>
      parseEnv({ ...valid, NEXTAUTH_SECRET: "", GOOGLE_CLIENT_ID: undefined }),
    ).toThrow(
      /NEXTAUTH_SECRET: is required[\s\S]*GOOGLE_CLIENT_ID: is required/,
    );
  });

  it("allows NEXTAUTH_URL to be unset", () => {
    expect(() => parseEnv({ ...valid, NEXTAUTH_URL: "" })).not.toThrow();
  });

  it("rejects a non-MySQL database URL", () => {
    expect(() =>
      parseEnv({ ...valid, DATABASE_URL: "postgres://localhost/db" }),
    ).toThrow(/DATABASE_URL: must be a mysql:\/\/ connection string/);
  });

  it("rejects malformed Paystack keys", () => {
    expect(() =>
      parseEnv({ ...valid, PAYSTACK_SECRET_KEY: "pk_test_wrong" }),
    ).toThrow(/PAYSTACK_SECRET_KEY: must start with sk_test_ or sk_live_/);
  });

  it("rejects mixing live and test Paystack keys", () => {
    expect(() =>
      parseEnv({ ...valid, PAYSTACK_SECRET_KEY: "sk_live_abc" }),
    ).toThrow(/both be test or both live/);
  });

  it("never includes values in the error", () => {
    try {
      parseEnv({ ...valid, DATABASE_URL: "postgres://user:hunter2@db/x" });
      expect.unreachable();
    } catch (error) {
      expect(String(error)).not.toContain("hunter2");
    }
  });
});
