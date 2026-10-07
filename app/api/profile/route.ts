import { NextResponse } from "next/server";
import { readJson, requireUser, withErrorHandling } from "@/lib/api";
import { getProfile, updateProfile } from "@/lib/services/users";
import { updateProfileSchema } from "@/schemas/profile";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const profile = await getProfile(user.id);
  return NextResponse.json({ success: true, profile });
});

export const PATCH = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = updateProfileSchema.parse(await readJson(request));
  const profile = await updateProfile(user.id, input);
  return NextResponse.json({ success: true, profile });
});
