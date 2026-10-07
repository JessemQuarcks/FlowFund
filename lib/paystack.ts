import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import { errors } from "@/lib/errors";

export type PaystackTransaction = {
  status: string;
  reference: string;
  amount: number; // pesewas
  currency: string;
  metadata?: Record<string, unknown> | string | null;
};

export type PaystackVerifyResponse = {
  status: boolean;
  message?: string;
  data?: PaystackTransaction;
};

export type InitializeTransactionInput = {
  email: string;
  amount: number; // pesewas
  currency: string;
  reference: string;
  metadata: Record<string, unknown>;
};

export type PaystackInitializeResponse = {
  status: boolean;
  message?: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
};

const PAYSTACK_BASE = "https://api.paystack.co";

function authHeaders() {
  return {
    Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  };
}

// Starts a transaction from the server with our own reference and metadata, so
// the client cannot choose the amount, fundraiser or reference. Returns the
// access code the inline popup resumes with.
export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<NonNullable<PaystackInitializeResponse["data"]>> {
  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
      method: "POST",
      headers: authHeaders(),
      cache: "no-store",
      body: JSON.stringify({
        email: input.email,
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        metadata: input.metadata,
      }),
    });
  } catch (error) {
    console.error("Paystack initialize request failed:", error);
    throw errors.upstreamFailed("Could not reach the payment provider");
  }

  const body = (await response
    .json()
    .catch(() => null)) as PaystackInitializeResponse | null;
  if (!response.ok || !body?.status || !body.data) {
    console.error(
      `Paystack initialize returned HTTP ${response.status}`,
      body?.message,
    );
    throw errors.upstreamFailed("Could not start the payment");
  }
  return body.data;
}

// Confirms a webhook really came from Paystack: the x-paystack-signature header
// is an HMAC-SHA512 of the exact raw request body, keyed by the secret key.
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) return false;
  const expected = createHmac("sha512", env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  // Length check first: timingSafeEqual throws on a length mismatch.
  return a.length === b.length && timingSafeEqual(a, b);
}

// Looks up a transaction by reference. Returns the full Paystack response
// so callers can keep it, or null when Paystack does not know the
// reference.
export async function verifyTransaction(
  reference: string,
): Promise<PaystackVerifyResponse | null> {
  let response: Response;
  try {
    response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}` },
        cache: "no-store",
      },
    );
  } catch (error) {
    console.error("Paystack verify request failed:", error);
    throw errors.upstreamFailed("Could not reach the payment provider");
  }

  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    console.error(`Paystack verify returned HTTP ${response.status}`);
    throw errors.upstreamFailed("Could not reach the payment provider");
  }
  return (await response.json()) as PaystackVerifyResponse;
}
