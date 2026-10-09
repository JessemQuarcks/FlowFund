import { NextResponse } from "next/server";
import { readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { setEventStatus } from "@/lib/services/moderation";
import { setEventStatusSchema } from "@/schemas/moderation";

type Context = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const { status } = setEventStatusSchema.parse(await readJson(request));
    await setEventStatus(admin.id, id, status);
    return NextResponse.json({ success: true });
  },
);
