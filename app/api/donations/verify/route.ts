import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordDonationByReference } from "@/lib/services/donations";
import { verifyDonationSchema } from "@/schemas/donation";

// Confirms a donation from the browser after the popup closes. This is a
// convenience so the thank-you page can show at once; the Paystack webhook is
// the authoritative record. Both call the same idempotent recorder.
export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `verify:ip:${getClientIp(request.headers)}`,
    30,
    10 * 60 * 1000,
  );
  const { reference } = verifyDonationSchema.parse(await readJson(request));
  const donation = await recordDonationByReference(reference);
  return NextResponse.json({ success: true, donation });
});
