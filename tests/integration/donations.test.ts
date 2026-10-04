import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { verifyTransaction, type PaystackVerifyResponse } from "@/lib/paystack";
import { recordVerifiedDonation } from "@/lib/services/donations";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

vi.mock("@/lib/paystack", () => ({ verifyTransaction: vi.fn() }));
const paystack = vi.mocked(verifyTransaction);

// Paystack reports amounts in pesewas.
function paystackSuccess(
  reference: string,
  fundraiserId: string,
  overrides: Partial<NonNullable<PaystackVerifyResponse["data"]>> = {},
): PaystackVerifyResponse {
  return {
    status: true,
    data: {
      status: "success",
      reference,
      amount: 5_000,
      currency: "GHS",
      metadata: { fundraiser_id: fundraiserId },
      ...overrides,
    },
  };
}

// Answers every lookup as a successful payment to this fundraiser.
function paystackApproves(fundraiserId: string, amount = 5_000) {
  paystack.mockImplementation(async (reference) =>
    paystackSuccess(reference, fundraiserId, { amount }),
  );
}

const donor = (email: string) => ({
  firstName: "Kofi",
  lastName: "Mensah",
  email,
});

async function setup() {
  const user = await createUser();
  const event = await createEventWithFundraiser(user.id);
  return event.fundraiser!;
}

function fundraiserTotals(id: string) {
  return prisma.fundraiser.findUniqueOrThrow({
    where: { id },
    select: { raisedAmount: true, donorCount: true },
  });
}

beforeEach(async () => {
  paystack.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("recordVerifiedDonation", () => {
  it("records a verified payment and updates the totals", async () => {
    const fundraiser = await setup();
    paystackApproves(fundraiser.id);
    const reference = randomUUID();

    const donation = await recordVerifiedDonation({
      reference,
      fundraiserId: fundraiser.id,
      donorInfo: donor("kofi@example.com"),
    });

    expect(donation).toEqual({ id: expect.any(String), amount: 50 });
    expect(Object.keys(donation)).not.toContain("paymentDetails");
    expect(await fundraiserTotals(fundraiser.id)).toEqual({
      raisedAmount: 50,
      donorCount: 1,
    });
  });

  it("counts a replayed reference once", async () => {
    const fundraiser = await setup();
    paystackApproves(fundraiser.id);
    const input = {
      reference: randomUUID(),
      fundraiserId: fundraiser.id,
      donorInfo: null,
    };

    const first = await recordVerifiedDonation(input);
    const second = await recordVerifiedDonation(input);

    expect(second).toEqual(first);
    expect(await prisma.donation.count()).toBe(1);
    expect((await fundraiserTotals(fundraiser.id)).raisedAmount).toBe(50);
    // The replay is answered from the database without asking Paystack.
    expect(paystack).toHaveBeenCalledTimes(1);
  });

  it("refuses a reference already credited to another fundraiser", async () => {
    const first = await setup();
    const second = await setup();
    paystackApproves(first.id);
    const reference = randomUUID();
    await recordVerifiedDonation({
      reference,
      fundraiserId: first.id,
      donorInfo: null,
    });

    await expect(
      recordVerifiedDonation({
        reference,
        fundraiserId: second.id,
        donorInfo: null,
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect((await fundraiserTotals(second.id)).raisedAmount).toBe(0);
  });

  it.each([
    ["the payment failed", { status: "failed" }],
    ["the currency is not GHS", { currency: "NGN" }],
    ["the reference differs", { reference: "someone-elses" }],
    [
      "the metadata names another fundraiser",
      { metadata: { fundraiser_id: "other" } },
    ],
    ["there is no metadata", { metadata: null }],
  ])("rejects the payment when %s", async (_case, overrides) => {
    const fundraiser = await setup();
    const reference = randomUUID();
    paystack.mockResolvedValue(
      paystackSuccess(reference, fundraiser.id, overrides),
    );

    await expect(
      recordVerifiedDonation({
        reference,
        fundraiserId: fundraiser.id,
        donorInfo: null,
      }),
    ).rejects.toMatchObject({ status: 400, code: "PAYMENT_FAILED" });
    expect(await prisma.donation.count()).toBe(0);
  });

  it("rejects a reference Paystack does not know", async () => {
    const fundraiser = await setup();
    paystack.mockResolvedValue(null);

    await expect(
      recordVerifiedDonation({
        reference: randomUUID(),
        fundraiserId: fundraiser.id,
        donorInfo: null,
      }),
    ).rejects.toMatchObject({ code: "PAYMENT_FAILED" });
  });

  it("returns 404 for a fundraiser that does not exist", async () => {
    paystackApproves("missing");
    await expect(
      recordVerifiedDonation({
        reference: randomUUID(),
        fundraiserId: "missing",
        donorInfo: null,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("counts a named donor once per fundraiser and anonymous gifts each time", async () => {
    const fundraiser = await setup();
    paystackApproves(fundraiser.id);
    const give = (donorInfo: ReturnType<typeof donor> | null) =>
      recordVerifiedDonation({
        reference: randomUUID(),
        fundraiserId: fundraiser.id,
        donorInfo,
      });

    await give(donor("ama@example.com"));
    await give(donor("ama@example.com"));
    await give(donor("yaw@example.com"));
    await give(null);
    await give(null);

    expect(await fundraiserTotals(fundraiser.id)).toEqual({
      raisedAmount: 250,
      donorCount: 4,
    });
  });

  it("records one donation when the same reference arrives concurrently", async () => {
    const fundraiser = await setup();
    paystackApproves(fundraiser.id);
    const input = {
      reference: randomUUID(),
      fundraiserId: fundraiser.id,
      donorInfo: null,
    };

    const results = await Promise.all(
      Array.from({ length: 5 }, () => recordVerifiedDonation(input)),
    );

    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(await prisma.donation.count()).toBe(1);
    expect((await fundraiserTotals(fundraiser.id)).raisedAmount).toBe(50);
  });

  it("adds up concurrent donations exactly", async () => {
    const fundraiser = await setup();
    paystackApproves(fundraiser.id, 1_250);

    await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        recordVerifiedDonation({
          reference: randomUUID(),
          fundraiserId: fundraiser.id,
          donorInfo: donor(`donor${i % 5}@example.com`),
        }),
      ),
    );

    expect(await fundraiserTotals(fundraiser.id)).toEqual({
      raisedAmount: 125,
      donorCount: 5,
    });
  });
});
