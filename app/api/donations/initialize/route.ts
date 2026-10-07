import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { initializeDonation } from "@/lib/services/donations";
import { initializeDonationSchema } from "@/schemas/donation";

// Starts a donation on the server so the amount, fundraiser and donor are set
// here and cannot be tampered with in the browser. Returns the access code the
// inline Paystack popup resumes with.
export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `donate:ip:${getClientIp(request.headers)}`,
    30,
    10 * 60 * 1000,
  );
  const input = initializeDonationSchema.parse(await readJson(request));
  const result = await initializeDonation(input);
  return NextResponse.json({ success: true, ...result });
});
