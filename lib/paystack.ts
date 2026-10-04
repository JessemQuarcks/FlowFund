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
