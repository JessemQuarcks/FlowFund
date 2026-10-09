import { NextResponse } from "next/server";
import { readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { resolveReport } from "@/lib/services/moderation";
import { resolveReportSchema } from "@/schemas/moderation";

type Context = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const { action } = resolveReportSchema.parse(await readJson(request));
    await resolveReport(admin.id, id, action);
    return NextResponse.json({ success: true });
  },
);
