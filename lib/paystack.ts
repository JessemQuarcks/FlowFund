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

async function paystackGet<T>(path: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_BASE}${path}`, {
      headers: authHeaders(),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`Paystack GET ${path} failed:`, error);
    throw errors.upstreamFailed("Could not reach the payment provider");
  }
  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: T;
  } | null;
  if (!response.ok || !body?.status) {
    throw errors.badRequest(
      body?.message ?? "Payment provider rejected the request",
    );
  }
  return body.data as T;
}

async function paystackPost<T>(path: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_BASE}${path}`, {
      method: "POST",
      headers: authHeaders(),
      cache: "no-store",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error(`Paystack POST ${path} failed:`, error);
    throw errors.upstreamFailed("Could not reach the payment provider");
  }
  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: T;
  } | null;
  if (!response.ok || !body?.status) {
    throw errors.badRequest(
      body?.message ?? "Payment provider rejected the request",
    );
  }
  return body.data as T;
}

export type ResolvedAccount = { account_number: string; account_name: string };

// Confirms an account number belongs to a real account and returns the holder's
// name as the bank/mobile-money operator records it.
export function resolveAccount(
  accountNumber: string,
  bankCode: string,
): Promise<ResolvedAccount> {
  const query = new URLSearchParams({
    account_number: accountNumber,
    bank_code: bankCode,
  });
  return paystackGet<ResolvedAccount>(`/bank/resolve?${query.toString()}`);
}

// Ghana recipient types: bank accounts clear over GhIPSS, wallets are
// mobile_money. The old code sent everything as ghipss.
export type RecipientType = "ghipss" | "mobile_money";

export type TransferRecipient = {
  recipient_code: string;
  type: string;
  details?: { account_name?: string | null };
};

export function createTransferRecipient(input: {
  type: RecipientType;
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}): Promise<TransferRecipient> {
  return paystackPost<TransferRecipient>("/transferrecipient", input);
}

export type TransferResult = {
  transfer_code: string;
  reference: string;
  status: string;
};

// Sends money out of the platform balance to a registered recipient. The
// final outcome arrives later by transfer webhook.
export function initiateTransfer(input: {
  amount: number; // pesewas
  recipient: string; // recipient_code
  reference: string;
  reason?: string;
  currency: string;
}): Promise<TransferResult> {
  return paystackPost<TransferResult>("/transfer", {
    source: "balance",
    ...input,
  });
}

export type PaystackTransfer = {
  status: string; // success | failed | reversed | pending | otp | ...
  reference: string;
  amount: number; // pesewas
  currency: string;
};

// Looks up a transfer by its reference, for reconciliation. Returns null when
// Paystack does not know the reference.
export async function verifyTransfer(
  reference: string,
): Promise<PaystackTransfer | null> {
  let response: Response;
  try {
    response = await fetch(
      `${PAYSTACK_BASE}/transfer/verify/${encodeURIComponent(reference)}`,
      { headers: authHeaders(), cache: "no-store" },
    );
  } catch (error) {
    console.error("Paystack transfer verify request failed:", error);
    throw errors.upstreamFailed("Could not reach the payment provider");
  }
  if (response.status === 404 || response.status === 400) return null;
  if (!response.ok) {
    throw errors.upstreamFailed("Could not reach the payment provider");
  }
  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    data?: PaystackTransfer;
  } | null;
  if (!body?.status || !body.data) return null;
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
