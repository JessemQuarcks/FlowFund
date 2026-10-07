import { NextResponse } from "next/server";
import { readJson, requireUser, withErrorHandling } from "@/lib/api";
import { changePassword } from "@/lib/services/users";
import { changePasswordSchema } from "@/schemas/profile";

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = changePasswordSchema.parse(await readJson(request));
  await changePassword(user.id, input);
  return NextResponse.json({ success: true });
});
