import { NextResponse } from "next/server";
import { readJson, requireUser, withErrorHandling } from "@/lib/api";
import { enforceRateLimit } from "@/lib/rate-limit";
import { requestWithdrawal } from "@/lib/services/withdrawals";
import { requestWithdrawalSchema } from "@/schemas/withdrawal";

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  enforceRateLimit(`withdraw:user:${user.id}`, 10, 60 * 60 * 1000);
  const input = requestWithdrawalSchema.parse(await readJson(request));
  const withdrawal = await requestWithdrawal(user.id, input);
  return NextResponse.json({ success: true, withdrawal });
});
