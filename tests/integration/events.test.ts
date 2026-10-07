import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createEvent,
  deleteEvent,
  getOwnedEvent,
  updateEvent,
} from "@/lib/services/events";
import { deleteImage, uploadEventImage } from "@/lib/services/images";
import type { CreateEventInput } from "@/schemas/event";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

vi.mock("@/lib/services/images", () => ({
  uploadEventImage: vi.fn(),
  deleteImage: vi.fn(),
}));
const upload = vi.mocked(uploadEventImage);
const destroy = vi.mocked(deleteImage);

const inAWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

function input(image?: File): CreateEventInput {
  return {
    event: {
      title: "Library drive",
      description: "Books for the school",
      category: "EDUCATIONAL",
      date: inAWeek(),
      image,
    },
    fundraiser: {
      targetAmount: 2_000,
      minimumAmount: 10,
      anonymity: true,
      endDate: inAWeek(),
    },
  };
}

const cover = () =>
  new File([new Uint8Array(10)], "cover.png", { type: "image/png" });

beforeEach(async () => {
  upload.mockReset();
  destroy.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("createEvent", () => {
  it("creates the event and its fundraiser together", async () => {
    const user = await createUser();
    upload.mockResolvedValue("https://cdn.test/new.png");

    const event = await createEvent(user.id, input(cover()));

    const saved = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
      include: { fundraiser: true },
    });
    expect(saved.userId).toBe(user.id);
    expect(saved.fundraiser).toMatchObject({
      targetAmount: 2_000,
      raisedAmount: 0,
      donorCount: 0,
      image: "https://cdn.test/new.png",
    });
  });

  it("removes the uploaded image if the database write fails", async () => {
    upload.mockResolvedValue("https://cdn.test/orphan.png");

    // No such user: the foreign key rejects the insert.
    await expect(createEvent(randomUUID(), input(cover()))).rejects.toThrow();

    expect(destroy).toHaveBeenCalledWith("https://cdn.test/orphan.png");
    expect(await prisma.event.count()).toBe(0);
    expect(await prisma.fundraiser.count()).toBe(0);
  });
});

describe("getOwnedEvent", () => {
  it("returns the owner's event", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id);
    const found = await getOwnedEvent(user.id, event.id);
    expect(found.fundraiser?.id).toBe(event.fundraiser!.id);
  });

  it("refuses other users and unknown IDs", async () => {
    const owner = await createUser();
    const other = await createUser();
    const event = await createEventWithFundraiser(owner.id);

    await expect(getOwnedEvent(other.id, event.id)).rejects.toMatchObject({
      status: 403,
    });
    await expect(getOwnedEvent(owner.id, "missing")).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("updateEvent", () => {
  it("replaces the image and deletes the old one only after saving", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id, {
      image: "https://cdn.test/old.png",
    });
    upload.mockResolvedValue("https://cdn.test/new.png");

    await updateEvent(user.id, event.id, input(cover()));

    const saved = await prisma.fundraiser.findUniqueOrThrow({
      where: { id: event.fundraiser!.id },
    });
    expect(saved.image).toBe("https://cdn.test/new.png");
    expect(saved.targetAmount).toBe(2_000);
    expect(destroy).toHaveBeenCalledWith("https://cdn.test/old.png");
  });

  it("keeps the current image when no new one is sent", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id, {
      image: "https://cdn.test/old.png",
    });

    await updateEvent(user.id, event.id, input());

    const saved = await prisma.fundraiser.findUniqueOrThrow({
      where: { id: event.fundraiser!.id },
    });
    expect(saved.image).toBe("https://cdn.test/old.png");
    expect(upload).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
  });

  it("refuses another user's event without uploading", async () => {
    const owner = await createUser();
    const other = await createUser();
    const event = await createEventWithFundraiser(owner.id);

    await expect(
      updateEvent(other.id, event.id, input(cover())),
    ).rejects.toMatchObject({ status: 403 });
    expect(upload).not.toHaveBeenCalled();
  });

  it("locks the target and minimum once a donation exists", async () => {
    const user = await createUser();
    // Helper sets targetAmount 10_000 and minimumAmount 1 (pesewas).
    const event = await createEventWithFundraiser(user.id);
    await prisma.donation.create({
      data: {
        reference: randomUUID(),
        amount: 5_000,
        fundraiserId: event.fundraiser!.id,
        paymentDetails: {},
      },
    });

    // input() uses a different target (2_000), so it must be refused.
    await expect(updateEvent(user.id, event.id, input())).rejects.toMatchObject(
      { status: 400 },
    );

    // Same target and minimum, other fields changed: allowed.
    await updateEvent(user.id, event.id, {
      event: {
        title: "Renamed",
        description: "Still going",
        category: "COMMUNITY",
        date: inAWeek(),
        image: undefined,
      },
      fundraiser: {
        targetAmount: 10_000,
        minimumAmount: 1,
        anonymity: false,
        endDate: inAWeek(),
      },
    });
    const saved = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    expect(saved.title).toBe("Renamed");
  });
});

describe("deleteEvent", () => {
  it("deletes an event without donations, its fundraiser and image", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id, {
      image: "https://cdn.test/old.png",
    });

    await deleteEvent(user.id, event.id);

    expect(await prisma.event.count()).toBe(0);
    expect(await prisma.fundraiser.count()).toBe(0);
    expect(destroy).toHaveBeenCalledWith("https://cdn.test/old.png");
  });

  it("refuses to delete an event that has donations", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id);
    await prisma.donation.create({
      data: {
        reference: randomUUID(),
        amount: 20,
        fundraiserId: event.fundraiser!.id,
        paymentDetails: {},
      },
    });

    await expect(deleteEvent(user.id, event.id)).rejects.toMatchObject({
      status: 409,
    });
    expect(await prisma.event.count()).toBe(1);
    expect(await prisma.donation.count()).toBe(1);
  });

  it("refuses another user's event", async () => {
    const owner = await createUser();
    const other = await createUser();
    const event = await createEventWithFundraiser(owner.id);

    await expect(deleteEvent(other.id, event.id)).rejects.toMatchObject({
      status: 403,
    });
    expect(await prisma.event.count()).toBe(1);
  });
});
