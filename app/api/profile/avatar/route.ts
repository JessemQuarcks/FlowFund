import { NextResponse } from "next/server";
import { requireUser, withErrorHandling } from "@/lib/api";
import { errors } from "@/lib/errors";
import { updateAvatar } from "@/lib/services/users";

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw errors.badRequest("Choose an image to upload");
  }
  const profile = await updateAvatar(user.id, file);
  return NextResponse.json({ success: true, profile });
});
