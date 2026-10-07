import { NextResponse } from "next/server";
import { readJson, requireUser, withErrorHandling } from "@/lib/api";
import { createUpdate, listUpdates } from "@/lib/services/updates";
import { createUpdateSchema } from "@/schemas/update";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    const updates = await listUpdates(id);
    return NextResponse.json({ success: true, updates });
  },
);

export const POST = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const user = await requireUser();
    const input = createUpdateSchema.parse(await readJson(request));
    const update = await createUpdate(user.id, id, input);
    return NextResponse.json({ success: true, update });
  },
);
