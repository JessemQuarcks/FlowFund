import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api";
import { AppError } from "@/lib/errors";
import { verifyWebhookSignature } from "@/lib/paystack";
import { recordDonationByReference } from "@/lib/services/donations";

// Paystack's server-to-server notification. This is the source of truth for a
// donation: charge.success records it. The request is trusted only after its
// HMAC signature checks out against the raw body.
//
// Idempotency comes from the unique reference, so a retried webhook is safe.
// A permanent failure (unknown reference or fundraiser) is acknowledged so
// Paystack stops retrying; a transient one throws, becoming a non-2xx that
// Paystack will retry.
export const POST = withErrorHandling(async (request: Request) => {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "Invalid signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: unknown } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true });
  }

  if (event.event === "charge.success") {
    const reference = event.data?.reference;
    if (typeof reference === "string") {
      try {
        await recordDonationByReference(reference);
      } catch (error) {
        const permanent =
          error instanceof AppError &&
          (error.code === "PAYMENT_FAILED" || error.code === "NOT_FOUND");
        if (!permanent) throw error;
        console.error(
          `Webhook: could not attribute charge ${reference}:`,
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  return NextResponse.json({ received: true });
});
