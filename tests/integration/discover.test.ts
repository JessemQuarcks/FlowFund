import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { Event_Category } from "@/lib/generated/prisma";
import { featuredEvents, searchEvents } from "@/lib/services/events";
import { createUser, resetDatabase } from "./helpers";

const DAY = 24 * 60 * 60 * 1000;

async function makeEvent(
  userId: string,
  opts: {
    title: string;
    description?: string;
    category?: Event_Category;
    target?: number; // pesewas
    raised?: number;
    donors?: number;
    endsInDays?: number;
  },
) {
  return prisma.event.create({
    data: {
      userId,
      title: opts.title,
      description: opts.description ?? "A good cause",
      category: opts.category ?? "COMMUNITY",
      date: new Date(Date.now() + 7 * DAY),
      fundraiser: {
        create: {
          targetAmount: opts.target ?? 100_000,
          minimumAmount: 100,
          endDate: new Date(Date.now() + (opts.endsInDays ?? 7) * DAY),
          anonymity: false,
          raisedAmount: opts.raised ?? 0,
          donorCount: opts.donors ?? 0,
          totalWithdrawn: 0,
        },
      },
    },
    include: { fundraiser: true },
  });
}

const defaults = { sort: "trending" as const, page: 1 };

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("searchEvents", () => {
  it("filters by search term across title and description", async () => {
    const user = await createUser();
    await makeEvent(user.id, { title: "Beach clean-up" });
    await makeEvent(user.id, {
      title: "Library drive",
      description: "Books for the beach school",
    });
    await makeEvent(user.id, { title: "Animal shelter" });

    const { events, total } = await searchEvents({ ...defaults, q: "beach" });
    expect(total).toBe(2);
    expect(events.map((e) => e.title).sort()).toEqual([
      "Beach clean-up",
      "Library drive",
    ]);
  });

  it("filters by category and goal range", async () => {
    const user = await createUser();
    await makeEvent(user.id, {
      title: "Clinic",
      category: "MEDICAL",
      target: 500_00,
    });
    await makeEvent(user.id, { title: "School", category: "EDUCATIONAL" });

    const byCategory = await searchEvents({
      ...defaults,
      category: "MEDICAL",
    });
    expect(byCategory.events.map((e) => e.title)).toEqual(["Clinic"]);

    // Goal 100..600 GHS = 10_000..60_000 pesewas excludes the 100_000 target.
    const byGoal = await searchEvents({ ...defaults, min: 100, max: 600 });
    expect(byGoal.events.map((e) => e.title)).toEqual(["Clinic"]);
  });

  it("sorts by the chosen option", async () => {
    const user = await createUser();
    await makeEvent(user.id, { title: "Low", raised: 1_000, donors: 1 });
    await makeEvent(user.id, { title: "High", raised: 9_000, donors: 9 });

    const mostFunded = await searchEvents({ ...defaults, sort: "most-funded" });
    expect(mostFunded.events.map((e) => e.title)).toEqual(["High", "Low"]);
  });

  it("paginates", async () => {
    const user = await createUser();
    for (let i = 0; i < 11; i++) {
      await makeEvent(user.id, { title: `Event ${i}` });
    }

    const first = await searchEvents({ ...defaults, page: 1 });
    expect(first.events).toHaveLength(9);
    expect(first.total).toBe(11);
    expect(first.totalPages).toBe(2);

    const second = await searchEvents({ ...defaults, page: 2 });
    expect(second.events).toHaveLength(2);
  });
});

describe("featuredEvents", () => {
  it("returns only current campaigns, most active first, limited", async () => {
    const user = await createUser();
    await makeEvent(user.id, { title: "Ended", endsInDays: -1, donors: 100 });
    await makeEvent(user.id, { title: "Quiet", donors: 1 });
    await makeEvent(user.id, { title: "Popular", donors: 50 });

    const featured = await featuredEvents(2);
    expect(featured.map((e) => e.title)).toEqual(["Popular", "Quiet"]);
  });
});
