import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { createReport } from "@/lib/services/moderation";
import { createReportSchema } from "@/schemas/moderation";

type Context = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (request: Request, { params }: Context) => {
    enforceRateLimit(
      `report:ip:${getClientIp(request.headers)}`,
      10,
      60 * 60 * 1000,
    );
    const { id } = await params;
    const input = createReportSchema.parse(await readJson(request));
    await createReport(id, input);
    return NextResponse.json({ success: true });
  },
);
