import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { resetPassword } from "@/lib/services/password-reset";
import { resetPasswordSchema } from "@/schemas/auth";

export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `reset:ip:${getClientIp(request.headers)}`,
    10,
    60 * 60 * 1000,
  );
  const { token, password } = resetPasswordSchema.parse(
    await readJson(request),
  );
  await resetPassword(token, password);
  return NextResponse.json({ success: true });
});
