import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import type { CreateEventInput, UpdateEventInput } from "@/schemas/event";
import type { EventWithFundraiser } from "@/types";
import {
  EVENTS_PER_PAGE,
  type DiscoverParams,
  type SortOption,
} from "@/schemas/discover";
import { toMinorUnits } from "@/lib/money";
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

// Builds the Prisma `where` for a discover query. Exported for unit testing.
export function buildDiscoverWhere(
  params: DiscoverParams,
): Prisma.EventWhereInput {
  const where: Prisma.EventWhereInput = {};
  const and: Prisma.EventWhereInput[] = [];

  if (params.q) {
    and.push({
      OR: [
        { title: { contains: params.q } },
        { description: { contains: params.q } },
      ],
    });
  }
  if (params.category) {
    and.push({ category: params.category });
  }

  // Goal range is on the fundraiser; applying it also excludes events that
  // have no fundraiser. Amounts come from the form in GHS.
  if (params.min !== undefined || params.max !== undefined) {
    const targetAmount: Prisma.IntFilter = {};
    if (params.min !== undefined) targetAmount.gte = toMinorUnits(params.min);
    if (params.max !== undefined) targetAmount.lte = toMinorUnits(params.max);
    and.push({ fundraiser: { is: { targetAmount } } });
  }

  if (and.length) where.AND = and;
  return where;
}

// Maps a sort option to a Prisma `orderBy`. Nested keys sort by the related
// fundraiser; events without one sort last on those.
export function buildDiscoverOrderBy(
  sort: SortOption,
): Prisma.EventOrderByWithRelationInput {
  switch (sort) {
    case "newest":
      return { dateAdded: "desc" };
    case "most-funded":
      return { fundraiser: { raisedAmount: "desc" } };
    case "ending-soon":
      return { fundraiser: { endDate: "asc" } };
    case "trending":
    default:
      return { fundraiser: { donorCount: "desc" } };
  }
}

export type DiscoverResult = {
  events: Awaited<ReturnType<typeof searchEvents>>["events"];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

// Runs a discover query: filtered, sorted and paginated. Returns the page of
// events with their fundraisers plus the total for pagination controls.
export async function searchEvents(params: DiscoverParams) {
  const where = buildDiscoverWhere(params);
  const orderBy = buildDiscoverOrderBy(params.sort);
  const perPage = EVENTS_PER_PAGE;
  const page = Math.max(1, params.page);

  const [events, total] = await Promise.all([
    prisma.event.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        fundraiser: true,
        user: { select: { name: true, isVerifiedOrganiser: true } },
      },
    }),
    prisma.event.count({ where }),
  ]);

  return {
    events,
    total,
    page,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}

// A small, curated set for the home page: the most active current campaigns,
// not every event in the database.
export async function featuredEvents(limit = 6) {
  return prisma.event.findMany({
    where: { fundraiser: { is: { endDate: { gt: new Date() } } } },
    orderBy: { fundraiser: { donorCount: "desc" } },
    take: limit,
    include: {
      fundraiser: true,
      user: { select: { name: true, isVerifiedOrganiser: true } },
    },
  });
}

// Platform-wide totals for the home page stats band.
export async function platformStats() {
  const [raised, campaigns, donors] = await Promise.all([
    prisma.fundraiser.aggregate({ _sum: { raisedAmount: true } }),
    prisma.event.count(),
    prisma.fundraiser.aggregate({ _sum: { donorCount: true } }),
  ]);
  return {
    totalRaised: raised._sum.raisedAmount ?? 0, // pesewas
    campaigns,
    donors: donors._sum.donorCount ?? 0,
  };
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
  input: UpdateEventInput,
) {
  const existing = await prisma.event.findUnique({
    where: { id: eventId },
    include: {
      fundraiser: { include: { _count: { select: { donations: true } } } },
    },
  });
  if (!existing) throw errors.notFound("Event not found");
  if (existing.userId !== userId) throw errors.forbidden();

  const {
    event: { image, ...eventData },
    fundraiser,
  } = input;

  // Once a fundraiser has a donation, the goal and the minimum are locked:
  // donors gave against those terms, so they must not change underneath them.
  const hasDonations =
    !!existing.fundraiser && existing.fundraiser._count.donations > 0;
  if (
    hasDonations &&
    existing.fundraiser &&
    (fundraiser.targetAmount !== existing.fundraiser.targetAmount ||
      fundraiser.minimumAmount !== existing.fundraiser.minimumAmount)
  ) {
    throw errors.badRequest(
      "The target and minimum cannot change after the first donation",
    );
  }

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
