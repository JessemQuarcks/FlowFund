import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { signUp } from "@/lib/services/users";
import { sendVerificationEmail } from "@/lib/services/email-verification";
import { signupSchema } from "@/schemas/auth";
import { env } from "@/lib/env";

export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `signup:ip:${getClientIp(request.headers)}`,
    5,
    60 * 60 * 1000,
  );
  const input = signupSchema.parse(await readJson(request));
  const user = await signUp(input);

  // Send the confirmation email, but never fail the sign-up over it.
  try {
    const baseUrl = env.NEXTAUTH_URL ?? new URL(request.url).origin;
    await sendVerificationEmail(input.email, baseUrl);
  } catch (error) {
    console.error("Could not send verification email:", error);
  }

  return NextResponse.json(user);
});
