import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { signUp } from "@/lib/services/users";
import { signupSchema } from "@/schemas/auth";

export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `signup:ip:${getClientIp(request.headers)}`,
    5,
    60 * 60 * 1000,
  );
  const input = signupSchema.parse(await readJson(request));
  const user = await signUp(input);
  return NextResponse.json(user);
});
