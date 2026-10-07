import { NextResponse } from "next/server";
import { requireUser, withErrorHandling } from "@/lib/api";
import { deleteEvent, getOwnedEvent, updateEvent } from "@/lib/services/events";
import { updateEventSchema } from "@/schemas/event";

type Context = { params: Promise<{ id: string }> };

export const GET = withErrorHandling(
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    const user = await requireUser();
    const event = await getOwnedEvent(user.id, id);
    return NextResponse.json({ success: true, data: event });
  },
);

export const PUT = withErrorHandling(
  async (request: Request, { params }: Context) => {
    const { id } = await params;
    const user = await requireUser();
    const input = updateEventSchema.parse(await request.formData());
    const event = await updateEvent(user.id, id, input);
    return NextResponse.json({ message: "Event updated successfully", event });
  },
);

export const DELETE = withErrorHandling(
  async (_request: Request, { params }: Context) => {
    const { id } = await params;
    const user = await requireUser();
    await deleteEvent(user.id, id);
    return NextResponse.json({ message: "Event deleted successfully" });
  },
);
