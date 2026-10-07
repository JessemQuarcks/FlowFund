import { NextResponse } from "next/server";
import { requireUser, withErrorHandling } from "@/lib/api";
import { deleteUpdate } from "@/lib/services/updates";

type Context = { params: Promise<{ id: string; updateId: string }> };

export const DELETE = withErrorHandling(
  async (_request: Request, { params }: Context) => {
    const { id, updateId } = await params;
    const user = await requireUser();
    await deleteUpdate(user.id, id, updateId);
    return NextResponse.json({ success: true });
  },
);
