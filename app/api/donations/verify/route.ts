import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { recordVerifiedDonation } from "@/lib/services/donations";
import { verifyDonationSchema } from "@/schemas/donation";

export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `verify:ip:${getClientIp(request.headers)}`,
    30,
    10 * 60 * 1000,
  );
  const input = verifyDonationSchema.parse(await readJson(request));
  const donation = await recordVerifiedDonation(input);
  return NextResponse.json({ success: true, donation });
});
