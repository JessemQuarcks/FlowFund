import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createUpdate,
  deleteUpdate,
  listUpdates,
} from "@/lib/services/updates";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("campaign updates", () => {
  it("lets the owner post an update and lists newest first", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id);

    await createUpdate(user.id, event.id, { title: "First", body: "one" });
    await createUpdate(user.id, event.id, { title: "Second", body: "two" });

    const updates = await listUpdates(event.id);
    expect(updates.map((u) => u.title)).toEqual(["Second", "First"]);
  });

  it("refuses a non-owner", async () => {
    const owner = await createUser();
    const other = await createUser();
    const event = await createEventWithFundraiser(owner.id);

    await expect(
      createUpdate(other.id, event.id, { title: "Hi", body: "x" }),
    ).rejects.toMatchObject({ status: 403 });
    expect(await prisma.update.count()).toBe(0);
  });

  it("deletes only the owner's own update", async () => {
    const owner = await createUser();
    const other = await createUser();
    const event = await createEventWithFundraiser(owner.id);
    const update = await createUpdate(owner.id, event.id, {
      title: "T",
      body: "b",
    });

    await expect(
      deleteUpdate(other.id, event.id, update.id),
    ).rejects.toMatchObject({ status: 403 });

    await deleteUpdate(owner.id, event.id, update.id);
    expect(await prisma.update.count()).toBe(0);
  });
});
