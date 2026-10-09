import { NextResponse } from "next/server";
import { readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { setUserBanned } from "@/lib/services/moderation";
import { setUserBannedSchema } from "@/schemas/moderation";

type Context = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const { banned } = setUserBannedSchema.parse(await readJson(request));
    await setUserBanned(admin.id, id, banned);
    return NextResponse.json({ success: true });
  },
);
