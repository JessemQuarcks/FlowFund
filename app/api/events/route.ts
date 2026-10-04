import { NextResponse } from "next/server";
import { requireUser, withErrorHandling } from "@/lib/api";
import { createEvent } from "@/lib/services/events";
import { createEventSchema } from "@/schemas/event";

export const POST = withErrorHandling(async (request: Request) => {
  const user = await requireUser();
  const input = createEventSchema.parse(await request.formData());
  const event = await createEvent(user.id, input);
  return NextResponse.json(event);
});
