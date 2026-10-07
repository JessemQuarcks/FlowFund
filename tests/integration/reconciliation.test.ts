import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  verifyTransaction,
  verifyTransfer,
  type PaystackVerifyResponse,
} from "@/lib/paystack";
import { reconcile } from "@/lib/services/reconciliation";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

vi.mock("@/lib/paystack", () => ({
  verifyTransaction: vi.fn(),
  verifyTransfer: vi.fn(),
}));
const txn = vi.mocked(verifyTransaction);
const transfer = vi.mocked(verifyTransfer);

function paymentFor(
  reference: string,
  amount: number,
  overrides: Partial<NonNullable<PaystackVerifyResponse["data"]>> = {},
): PaystackVerifyResponse {
  return {
    status: true,
    data: {
      status: "success",
      reference,
      amount,
      currency: "GHS",
      ...overrides,
    },
  };
}

// A fundraiser with its counters set, plus a matching donation row. By default
// everything agrees; tests then introduce a single disagreement.
async function setupWithDonation(amount = 5_000) {
  const user = await createUser();
  const event = await createEventWithFundraiser(user.id);
  const fundraiserId = event.fundraiser!.id;
  const reference = `ff_${randomUUID()}`;

  await prisma.donation.create({
    data: {
      reference,
      amount,
      currency: "GHS",
      fundraiserId,
      donorEmail: "kofi@example.com",
      paymentDetails: {},
    },
  });
  await prisma.fundraiser.update({
    where: { id: fundraiserId },
    data: { raisedAmount: amount, donorCount: 1 },
  });

  txn.mockImplementation(async (ref) =>
    ref === reference ? paymentFor(reference, amount) : null,
  );

  return { user, fundraiserId, reference, amount };
}

beforeEach(async () => {
  txn.mockReset();
  transfer.mockReset();
  txn.mockResolvedValue(null);
  transfer.mockResolvedValue(null);
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("reconcile", () => {
  it("reports no drift when the ledger and Paystack agree", async () => {
    await setupWithDonation();

    const report = await reconcile();

    expect(report.hasDrift).toBe(false);
    expect(report.drifts).toHaveLength(0);
    expect(report.checkedDonations).toBe(1);
  });

  it("detects a counter that drifted from the ledger", async () => {
    const { fundraiserId } = await setupWithDonation(5_000);
    // Corrupt the stored total so it no longer matches the donations.
    await prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { raisedAmount: 9_999 },
    });

    const report = await reconcile();

    expect(report.hasDrift).toBe(true);
    const drift = report.drifts.find(
      (d) => d.kind === "fundraiser_counters" && d.id === fundraiserId,
    );
    expect(drift).toMatchObject({ expected: 5_000, actual: 9_999 });
  });

  it("detects a donation whose amount differs from Paystack", async () => {
    const { reference } = await setupWithDonation(5_000);
    // Paystack now reports a different amount for the same reference.
    txn.mockImplementation(async (ref) =>
      ref === reference ? paymentFor(reference, 4_000) : null,
    );

    const report = await reconcile();

    const drift = report.drifts.find((d) => d.kind === "donation");
    expect(drift).toMatchObject({
      reference,
      expected: 4_000,
      actual: 5_000,
    });
  });

  it("detects a withdrawal whose status disagrees with Paystack", async () => {
    const user = await createUser();
    const event = await createEventWithFundraiser(user.id);
    const fundraiserId = event.fundraiser!.id;
    const reference = `wd_${randomUUID()}`;

    await prisma.withdrawal.create({
      data: {
        amount: 5_000,
        currency: "GHS",
        fundraiserId,
        userId: user.id,
        accountType: "BANK_ACCOUNT",
        recipientCode: "RCP_1",
        status: "PROCESSING",
        reference,
        paymentDetails: {},
      },
    });
    // The reserved withdrawal is counted so the counters still agree.
    await prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { totalWithdrawn: 5_000 },
    });
    // Paystack says the transfer already succeeded.
    transfer.mockResolvedValue({
      status: "success",
      reference,
      amount: 5_000,
      currency: "GHS",
    });

    const report = await reconcile();

    const drift = report.drifts.find((d) => d.kind === "withdrawal");
    expect(drift).toMatchObject({
      reference,
      expected: "COMPLETED",
      actual: "PROCESSING",
    });
  });

  it("records the run and each drift in the audit log", async () => {
    const { fundraiserId } = await setupWithDonation(5_000);
    await prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { donorCount: 7 }, // wrong on purpose
    });

    await reconcile();

    expect(
      await prisma.auditLog.count({ where: { action: "reconciliation.run" } }),
    ).toBe(1);
    expect(
      await prisma.auditLog.count({
        where: { action: "reconciliation.drift" },
      }),
    ).toBeGreaterThanOrEqual(1);
  });
});
