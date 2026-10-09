import { NextResponse } from "next/server";
import { readJson, requireUser, withErrorHandling } from "@/lib/api";
import {
  getVerificationState,
  submitVerification,
} from "@/lib/services/verification";
import { submitVerificationSchema } from "@/schemas/verification";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const state = await getVerificationState(user.id);
  return NextResponse.json({ success: true, ...state });
});

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = submitVerificationSchema.parse(await readJson(request));
  const result = await submitVerification(user.id, input);
  return NextResponse.json({ success: true, ...result });
});
