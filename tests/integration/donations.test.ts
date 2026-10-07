import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  initializeTransaction,
  verifyTransaction,
  type PaystackVerifyResponse,
} from "@/lib/paystack";
import {
  initializeDonation,
  recordDonationByReference,
} from "@/lib/services/donations";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

vi.mock("@/lib/paystack", () => ({
  verifyTransaction: vi.fn(),
  initializeTransaction: vi.fn(),
}));
const paystackVerify = vi.mocked(verifyTransaction);
const paystackInit = vi.mocked(initializeTransaction);

type Donor = { firstName: string; lastName: string; email: string };
const donor = (email: string): Donor => ({
  firstName: "Kofi",
  lastName: "Mensah",
  email,
});

// Each reference maps to the payment Paystack would report for it. The mock
// answers verifyTransaction from this registry, so tests register a payment
// before recording it.
const payments = new Map<string, PaystackVerifyResponse>();

// Paystack reports amounts in pesewas and echoes back the metadata the server
// set when it initialised the transaction.
function paystackSuccess(
  reference: string,
  fundraiserId: string,
  {
    amount = 5_000,
    donor: who = null as Donor | null,
    currency = "GHS",
    ...dataOverrides
  }: {
    amount?: number;
    donor?: Donor | null;
    currency?: string;
    status?: string;
    reference?: string;
    metadata?: unknown;
  } = {},
): PaystackVerifyResponse {
  return {
    status: true,
    data: {
      status: "success",
      reference,
      amount,
      currency,
      metadata: {
        fundraiser_id: fundraiserId,
        is_anonymous: !who,
        donor: who,
      },
      ...dataOverrides,
    } as PaystackVerifyResponse["data"],
  };
}

// Registers a payment for a fresh reference and records it, as the live flow
// does after a successful popup.
function give(
  fundraiserId: string,
  options: { amount?: number; donor?: Donor | null } = {},
) {
  const reference = `ff_${randomUUID()}`;
  payments.set(reference, paystackSuccess(reference, fundraiserId, options));
  return recordDonationByReference(reference);
}

async function setup(fundraiser: { minimumAmount?: number } = {}) {
  const user = await createUser();
  const event = await createEventWithFundraiser(user.id, fundraiser);
  return event.fundraiser!;
}

function fundraiserTotals(id: string) {
  return prisma.fundraiser.findUniqueOrThrow({
    where: { id },
    select: { raisedAmount: true, donorCount: true },
  });
}

beforeEach(async () => {
  paystackVerify.mockReset();
  paystackInit.mockReset();
  payments.clear();
  paystackVerify.mockImplementation(async (reference) => {
    if (reference === "someone-elses") return null;
    return payments.get(reference) ?? null;
  });
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("initializeDonation", () => {
  const start = (fundraiserId: string, amount: number) =>
    initializeDonation({
      fundraiserId,
      amount,
      isAnonymous: false,
      email: "kofi@example.com",
      firstName: "Kofi",
      lastName: "Mensah",
    });

  it("asks Paystack to start a transaction with server-set details", async () => {
    const fundraiser = await setup();
    paystackInit.mockResolvedValue({
      authorization_url: "https://paystack.test/pay",
      access_code: "ACCESS_123",
      reference: "",
    });

    const result = await start(fundraiser.id, 50);

    expect(result.accessCode).toBe("ACCESS_123");
    expect(result.reference).toMatch(/^ff_/);
    expect(paystackInit).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5_000, // 50 GHS in pesewas
        currency: "GHS",
        email: "kofi@example.com",
        reference: result.reference,
        metadata: expect.objectContaining({
          fundraiser_id: fundraiser.id,
          is_anonymous: false,
          donor: expect.objectContaining({ email: "kofi@example.com" }),
        }),
      }),
    );
  });

  it("omits donor details for an anonymous gift", async () => {
    const fundraiser = await setup();
    paystackInit.mockResolvedValue({
      authorization_url: "u",
      access_code: "AC",
      reference: "",
    });

    await initializeDonation({
      fundraiserId: fundraiser.id,
      amount: 50,
      isAnonymous: true,
      email: "secret@example.com",
    });

    expect(paystackInit).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ is_anonymous: true, donor: null }),
      }),
    );
  });

  it("rejects an amount below the fundraiser's minimum", async () => {
    const fundraiser = await setup({ minimumAmount: 1_000 }); // 10 GHS
    await expect(start(fundraiser.id, 5)).rejects.toMatchObject({
      status: 400,
    });
    expect(paystackInit).not.toHaveBeenCalled();
  });

  it("rejects a fundraiser that has already ended", async () => {
    const fundraiser = await setup();
    await prisma.fundraiser.update({
      where: { id: fundraiser.id },
      data: { endDate: new Date(Date.now() - 1_000) },
    });
    await expect(start(fundraiser.id, 50)).rejects.toMatchObject({
      status: 400,
    });
    expect(paystackInit).not.toHaveBeenCalled();
  });

  it("returns 404 for a fundraiser that does not exist", async () => {
    await expect(start("missing", 50)).rejects.toMatchObject({ status: 404 });
  });
});

describe("recordDonationByReference", () => {
  it("records a verified payment and updates the totals", async () => {
    const fundraiser = await setup();

    const donation = await give(fundraiser.id, {
      donor: donor("kofi@example.com"),
    });

    expect(donation).toEqual({ id: expect.any(String), amount: 5_000 });
    expect(Object.keys(donation)).not.toContain("paymentDetails");
    expect(await fundraiserTotals(fundraiser.id)).toEqual({
      raisedAmount: 5_000,
      donorCount: 1,
    });
  });

  it("counts a replayed reference once", async () => {
    const fundraiser = await setup();
    const reference = `ff_${randomUUID()}`;
    payments.set(reference, paystackSuccess(reference, fundraiser.id));

    const first = await recordDonationByReference(reference);
    const second = await recordDonationByReference(reference);

    expect(second).toEqual(first);
    expect(await prisma.donation.count()).toBe(1);
    expect((await fundraiserTotals(fundraiser.id)).raisedAmount).toBe(5_000);
    // The replay is answered from the database without asking Paystack.
    expect(paystackVerify).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the payment failed", { status: "failed" }],
    ["the currency is not the fundraiser's", { currency: "NGN" }],
    ["the reference differs", { reference: "someone-elses-ref" }],
    ["there is no metadata", { metadata: null }],
  ])("rejects the payment when %s", async (_case, overrides) => {
    const fundraiser = await setup();
    const reference = `ff_${randomUUID()}`;
    payments.set(
      reference,
      paystackSuccess(reference, fundraiser.id, overrides),
    );

    await expect(recordDonationByReference(reference)).rejects.toMatchObject({
      status: 400,
      code: "PAYMENT_FAILED",
    });
    expect(await prisma.donation.count()).toBe(0);
  });

  it("returns 404 when the metadata names an unknown fundraiser", async () => {
    const reference = `ff_${randomUUID()}`;
    payments.set(reference, paystackSuccess(reference, "missing"));

    await expect(recordDonationByReference(reference)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects a reference Paystack does not know", async () => {
    await expect(
      recordDonationByReference("someone-elses"),
    ).rejects.toMatchObject({ code: "PAYMENT_FAILED" });
  });

  it("counts a named donor once per fundraiser and anonymous gifts each time", async () => {
    const fundraiser = await setup();

    await give(fundraiser.id, { donor: donor("ama@example.com") });
    await give(fundraiser.id, { donor: donor("ama@example.com") });
    await give(fundraiser.id, { donor: donor("yaw@example.com") });
    await give(fundraiser.id, { donor: null });
    await give(fundraiser.id, { donor: null });

    expect(await fundraiserTotals(fundraiser.id)).toEqual({
      raisedAmount: 25_000,
      donorCount: 4,
    });
  });

  it("records one donation when the same reference arrives concurrently", async () => {
    const fundraiser = await setup();
    const reference = `ff_${randomUUID()}`;
    payments.set(reference, paystackSuccess(reference, fundraiser.id));

    const results = await Promise.all(
      Array.from({ length: 5 }, () => recordDonationByReference(reference)),
    );

    expect(new Set(results.map((r) => r.id)).size).toBe(1);
    expect(await prisma.donation.count()).toBe(1);
    expect((await fundraiserTotals(fundraiser.id)).raisedAmount).toBe(5_000);
  });

  it("adds up concurrent donations exactly", async () => {
    const fundraiser = await setup();
    const gifts = Array.from({ length: 10 }, (_, i) => {
      const reference = `ff_${randomUUID()}`;
      payments.set(
        reference,
        paystackSuccess(reference, fundraiser.id, {
          amount: 1_250,
          donor: donor(`donor${i % 5}@example.com`),
        }),
      );
      return reference;
    });

    await Promise.all(gifts.map((ref) => recordDonationByReference(ref)));

    expect(await fundraiserTotals(fundraiser.id)).toEqual({
      raisedAmount: 12_500,
      donorCount: 5,
    });
  });
});
