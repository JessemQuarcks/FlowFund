import { NextResponse } from "next/server";
import { requireUser, withErrorHandling } from "@/lib/api";
import { deletePayoutAccount } from "@/lib/services/payout-accounts";

type Context = { params: Promise<{ id: string }> };

export const DELETE = withErrorHandling(
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    const user = await requireUser();
    await deletePayoutAccount(user.id, id);
    return NextResponse.json({ success: true });
  },
);
