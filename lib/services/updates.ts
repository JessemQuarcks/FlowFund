import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { CreateUpdateInput } from "@/schemas/update";

export type PublicUpdate = {
  id: string;
  title: string;
  body: string;
  date: string;
};

function toPublic(u: {
  id: string;
  title: string;
  body: string;
  dateAdded: Date;
}): PublicUpdate {
  return {
    id: u.id,
    title: u.title,
    body: u.body,
    date: u.dateAdded.toISOString(),
  };
}

async function requireOwnedEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { userId: true },
  });
  if (!event) throw errors.notFound("Event not found");
  if (event.userId !== userId) throw errors.forbidden();
}

export async function listUpdates(eventId: string): Promise<PublicUpdate[]> {
  const updates = await prisma.update.findMany({
    where: { eventId },
    orderBy: { dateAdded: "desc" },
  });
  return updates.map(toPublic);
}

export async function createUpdate(
  userId: string,
  eventId: string,
  input: CreateUpdateInput,
): Promise<PublicUpdate> {
  await requireOwnedEvent(userId, eventId);
  const created = await prisma.update.create({
    data: { eventId, title: input.title, body: input.body },
  });
  return toPublic(created);
}

export async function deleteUpdate(
  userId: string,
  eventId: string,
  updateId: string,
) {
  await requireOwnedEvent(userId, eventId);
  const update = await prisma.update.findUnique({ where: { id: updateId } });
  if (!update || update.eventId !== eventId) {
    throw errors.notFound("Update not found");
  }
  await prisma.update.delete({ where: { id: updateId } });
}
