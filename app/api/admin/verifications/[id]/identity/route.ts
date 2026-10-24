import { NextResponse } from "next/server";
import { requireAdmin, withErrorHandling } from "@/lib/api";
import { viewVerificationIdentity } from "@/lib/services/verification";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(
  async (_request: Request, { params }: Context) => {
    const admin = await requireAdmin();
    const { id } = await params;
    const identity = await viewVerificationIdentity(admin.id, id);
    return NextResponse.json(identity, {
      headers: { "Cache-Control": "no-store" },
    });
  },
);
