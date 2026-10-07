import { NextResponse } from "next/server";
import { readJson, requireUser, withErrorHandling } from "@/lib/api";
import {
  addPayoutAccount,
  listPayoutAccounts,
} from "@/lib/services/payout-accounts";
import { addPayoutAccountSchema } from "@/schemas/withdrawal";

export const GET = withErrorHandling(async () => {
  const user = await requireUser();
  const accounts = await listPayoutAccounts(user.id);
  return NextResponse.json({ success: true, accounts });
});

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = addPayoutAccountSchema.parse(await readJson(request));
  const account = await addPayoutAccount(user.id, input);
  return NextResponse.json({ success: true, account });
});
