import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "@/lib/paystack";

// Must match vitest.config.mts testEnv.PAYSTACK_SECRET_KEY.
const SECRET = "sk_test_placeholder";

function sign(body: string) {
  return createHmac("sha512", SECRET).update(body).digest("hex");
}

describe("verifyWebhookSignature", () => {
  const body = JSON.stringify({ event: "charge.success", data: { x: 1 } });

  it("accepts a signature computed with the secret key", () => {
    expect(verifyWebhookSignature(body, sign(body))).toBe(true);
  });

  it("rejects a signature over a different body", () => {
    expect(verifyWebhookSignature(body, sign(body + "tampered"))).toBe(false);
  });

  it("rejects a missing or malformed signature", () => {
    expect(verifyWebhookSignature(body, null)).toBe(false);
    expect(verifyWebhookSignature(body, "")).toBe(false);
    expect(verifyWebhookSignature(body, "deadbeef")).toBe(false);
  });
});
