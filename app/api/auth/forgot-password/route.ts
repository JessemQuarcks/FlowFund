import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { requestPasswordReset } from "@/lib/services/password-reset";
import { forgotPasswordSchema } from "@/schemas/auth";
import { env } from "@/lib/env";

export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `forgot:ip:${getClientIp(request.headers)}`,
    5,
    60 * 60 * 1000,
  );
  const { email } = forgotPasswordSchema.parse(await readJson(request));
  const baseUrl = env.NEXTAUTH_URL ?? new URL(request.url).origin;
  await requestPasswordReset(email, baseUrl);
  // Always the same response, whether or not the email is registered.
  return NextResponse.json({
    success: true,
    message: "If that email has an account, a reset link is on its way.",
  });
});
