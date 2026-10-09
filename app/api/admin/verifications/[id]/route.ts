import { NextResponse } from "next/server";
import { readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { reviewVerification } from "@/lib/services/verification";
import { reviewVerificationSchema } from "@/schemas/verification";

type Context = { params: Promise<{ id: string }> };

export const POST = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const input = reviewVerificationSchema.parse(await readJson(request));
    const result = await reviewVerification(admin.id, id, input);
    return NextResponse.json({ success: true, ...result });
  },
);
