import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { CreateEventInput } from "@/schemas/event";
import type { EventWithFundraiser } from "@/types";
import { deleteImage, uploadEventImage } from "./images";

function hasImage(image: File | undefined): image is File {
  return image instanceof File && image.size > 0;
}

export async function createEvent(userId: string, input: CreateEventInput) {
  const {
    event: { image, ...eventData },
    fundraiser,
  } = input;

  const imageUrl = hasImage(image) ? await uploadEventImage(image) : undefined;

  try {
    // One nested write, so a failure cannot leave an event without its
    // fundraiser.
    return await prisma.event.create({
      data: {
        ...eventData,
        userId,
        fundraiser: {
          create: {
            ...fundraiser,
            image: imageUrl,
            raisedAmount: 0,
            donorCount: 0,
            totalWithdrawn: 0,
          },
        },
      },
    });
  } catch (error) {
    if (imageUrl) await deleteImage(imageUrl);
    throw error;
  }
}

export async function getOwnedEvent(
  userId: string,
  eventId: string,
): Promise<EventWithFundraiser> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    omit: { dateAdded: true, dateUpdated: true },
    include: {
      fundraiser: { omit: { dateAdded: true, dateUpdated: true } },
    },
  });
  if (!event) throw errors.notFound("Event not found");
  if (event.userId !== userId) throw errors.forbidden();
  return event;
}

export async function updateEvent(
  userId: string,
  eventId: string,
  input: CreateEventInput,
) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: { fundraiser: true },
  });
  if (!existing) throw errors.notFound("Event not found");
  if (existing.userId !== userId) throw errors.forbidden();

  const {
    event: { image, ...eventData },
    fundraiser,
  } = input;

  // Upload the new image before touching the old one, so a failed upload
  // leaves the event as it was.
  const newImageUrl = hasImage(image)
    ? await uploadEventImage(image)
    : undefined;

  let updated;
  try {
    updated = await prisma.$transaction(async (tx) => {
      const event = await tx.event.update({
        where: { id: eventId },
        data: eventData,
      });
      if (existing.fundraiser) {
        await tx.fundraiser.update({
          where: { id: existing.fundraiser.id },
          data: {
            ...fundraiser,
            ...(newImageUrl ? { image: newImageUrl } : {}),
          },
        });
      }
      return event;
    });
  } catch (error) {
    if (newImageUrl) await deleteImage(newImageUrl);
    throw error;
  }

  const oldImageUrl = existing.fundraiser?.image;
  if (newImageUrl && oldImageUrl) await deleteImage(oldImageUrl);

  return updated;
}

export async function deleteEvent(userId: string, eventId: string) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      fundraiser: {
        include: { _count: { select: { donations: true, withdrawals: true } } },
      },
    },
  });
  if (!event) throw errors.notFound("Event not found");
  if (event.userId !== userId) throw errors.forbidden();

  // Donation and withdrawal records must never be deleted.
  if (
    event.fundraiser &&
    (event.fundraiser._count.donations > 0 ||
      event.fundraiser._count.withdrawals > 0)
  ) {
    throw errors.conflict(
      "This event has received donations and cannot be deleted. Contact support to close it.",
    );
  }

  // The fundraiser foreign key has no cascade, so remove it first.
  await prisma.$transaction(async (tx) => {
    if (event.fundraiser) {
      await tx.fundraiser.delete({ where: { id: event.fundraiser.id } });
    }
    await tx.event.delete({ where: { id: eventId } });
  });

  if (event.fundraiser?.image) await deleteImage(event.fundraiser.image);
}
