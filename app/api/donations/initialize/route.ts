import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  // Link the donation to the donor when they are signed in. The id comes from
  // the session, never the request body.
  const session = await getServerSession(authOptions);
  const result = await initializeDonation(input, session?.user?.id);
  return NextResponse.json({ success: true, ...result });
});
