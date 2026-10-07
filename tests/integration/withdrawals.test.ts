import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  createTransferRecipient,
  initiateTransfer,
  resolveAccount,
} from "@/lib/paystack";
import { addPayoutAccount } from "@/lib/services/payout-accounts";
import {
  finalizeTransfer,
  requestWithdrawal,
} from "@/lib/services/withdrawals";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

vi.mock("@/lib/paystack", () => ({
  resolveAccount: vi.fn(),
  createTransferRecipient: vi.fn(),
  initiateTransfer: vi.fn(),
}));
const resolve = vi.mocked(resolveAccount);
const createRecipient = vi.mocked(createTransferRecipient);
const transfer = vi.mocked(initiateTransfer);

let recipientCounter = 0;

beforeEach(async () => {
  resolve.mockReset();
  createRecipient.mockReset();
  transfer.mockReset();
  recipientCounter = 0;

  resolve.mockResolvedValue({
    account_number: "0123456789",
    account_name: "Ama Owner",
  });
  createRecipient.mockImplementation(async () => ({
    recipient_code: `RCP_${++recipientCounter}`,
    type: "ghipss",
  }));
  // Echo the reference back, as Paystack does.
  transfer.mockImplementation(async (input) => ({
    transfer_code: "TRF_1",
    reference: input.reference,
    status: "pending",
  }));

  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

// A funded fundraiser owned by a fresh user, plus a verified payout account.
async function fundedSetup(raisedPesewas: number) {
  const user = await createUser();
  const event = await createEventWithFundraiser(user.id);
  await prisma.fundraiser.update({
    where: { id: event.fundraiser!.id },
    data: { raisedAmount: raisedPesewas },
  });
  const account = await addPayoutAccount(user.id, {
    accountType: "BANK_ACCOUNT",
    bankCode: "058",
    accountNumber: "0123456789",
  });
  return { user, fundraiser: event.fundraiser!, account };
}

function totalWithdrawn(id: string) {
  return prisma.fundraiser
    .findUniqueOrThrow({ where: { id }, select: { totalWithdrawn: true } })
    .then((f) => f.totalWithdrawn);
}

describe("addPayoutAccount", () => {
  it("resolves the account and registers it with the right recipient type", async () => {
    const user = await createUser();

    const bank = await addPayoutAccount(user.id, {
      accountType: "BANK_ACCOUNT",
      bankCode: "058",
      accountNumber: "0123456789",
    });
    expect(bank.accountName).toBe("Ama Owner");
    expect(Object.keys(bank)).not.toContain("recipientCode");
    expect(createRecipient).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "ghipss" }),
    );

    await addPayoutAccount(user.id, {
      accountType: "MOBILE_MONEY",
      bankCode: "MTN",
      accountNumber: "0240000000",
    });
    expect(createRecipient).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "mobile_money" }),
    );

    expect(
      await prisma.payoutAccount.count({ where: { userId: user.id } }),
    ).toBe(2);
  });
});

describe("requestWithdrawal", () => {
  it("reserves the funds and sends the transfer", async () => {
    const { user, fundraiser, account } = await fundedSetup(10_000);

    const result = await requestWithdrawal(user.id, {
      fundraiserId: fundraiser.id,
      payoutAccountId: account.id,
      amount: 50, // GHS
    });

    expect(result.status).toBe("PROCESSING");
    expect(result.amount).toBe(5_000);
    expect(await totalWithdrawn(fundraiser.id)).toBe(5_000);
    expect(transfer).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 5_000,
        recipient: "RCP_1",
        reference: result.reference,
        currency: "GHS",
      }),
    );
  });

  it("refuses to overdraw and leaves the balance untouched", async () => {
    const { user, fundraiser, account } = await fundedSetup(10_000);

    await expect(
      requestWithdrawal(user.id, {
        fundraiserId: fundraiser.id,
        payoutAccountId: account.id,
        amount: 200, // 20_000 pesewas > 10_000 available
      }),
    ).rejects.toMatchObject({ status: 400 });

    expect(await prisma.withdrawal.count()).toBe(0);
    expect(await totalWithdrawn(fundraiser.id)).toBe(0);
    expect(transfer).not.toHaveBeenCalled();
  });

  it("refuses another user's fundraiser", async () => {
    const { fundraiser, account } = await fundedSetup(10_000);
    const other = await createUser();

    await expect(
      requestWithdrawal(other.id, {
        fundraiserId: fundraiser.id,
        payoutAccountId: account.id,
        amount: 10,
      }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("never overdraws under concurrent requests", async () => {
    const { user, fundraiser, account } = await fundedSetup(10_000);

    // Five requests of 30 GHS (3_000 pesewas); only three fit in 10_000.
    const results = await Promise.allSettled(
      Array.from({ length: 5 }, () =>
        requestWithdrawal(user.id, {
          fundraiserId: fundraiser.id,
          payoutAccountId: account.id,
          amount: 30,
        }),
      ),
    );

    const fulfilled = results.filter((r) => r.status === "fulfilled").length;
    expect(fulfilled).toBe(3);
    const withdrawn = await totalWithdrawn(fundraiser.id);
    expect(withdrawn).toBe(9_000);
    expect(withdrawn).toBeLessThanOrEqual(10_000);
  });

  it("releases the reservation if Paystack rejects the transfer", async () => {
    const { user, fundraiser, account } = await fundedSetup(10_000);
    transfer.mockRejectedValueOnce(new Error("Paystack down"));

    await expect(
      requestWithdrawal(user.id, {
        fundraiserId: fundraiser.id,
        payoutAccountId: account.id,
        amount: 50,
      }),
    ).rejects.toThrow();

    expect(await totalWithdrawn(fundraiser.id)).toBe(0);
    const w = await prisma.withdrawal.findFirstOrThrow();
    expect(w.status).toBe("FAILED");
  });
});

describe("finalizeTransfer", () => {
  async function pendingWithdrawal() {
    const { user, fundraiser, account } = await fundedSetup(10_000);
    const w = await requestWithdrawal(user.id, {
      fundraiserId: fundraiser.id,
      payoutAccountId: account.id,
      amount: 50,
    });
    return { fundraiser, reference: w.reference };
  }

  it("completes on transfer.success and keeps the funds reserved", async () => {
    const { fundraiser, reference } = await pendingWithdrawal();

    await finalizeTransfer(reference, "success");

    const w = await prisma.withdrawal.findUniqueOrThrow({
      where: { reference },
    });
    expect(w.status).toBe("COMPLETED");
    expect(await totalWithdrawn(fundraiser.id)).toBe(5_000);
  });

  it("releases the funds on transfer.failed, idempotently", async () => {
    const { fundraiser, reference } = await pendingWithdrawal();

    await finalizeTransfer(reference, "failed");
    await finalizeTransfer(reference, "failed"); // repeat webhook

    const w = await prisma.withdrawal.findUniqueOrThrow({
      where: { reference },
    });
    expect(w.status).toBe("FAILED");
    expect(await totalWithdrawn(fundraiser.id)).toBe(0);
  });

  it("releases the funds when a completed transfer is reversed", async () => {
    const { fundraiser, reference } = await pendingWithdrawal();
    await finalizeTransfer(reference, "success");

    await finalizeTransfer(reference, "reversed");

    const w = await prisma.withdrawal.findUniqueOrThrow({
      where: { reference },
    });
    expect(w.status).toBe("REVERSED");
    expect(await totalWithdrawn(fundraiser.id)).toBe(0);
  });

  it("ignores an unknown transfer reference", async () => {
    await expect(
      finalizeTransfer("wd_unknown", "success"),
    ).resolves.toBeUndefined();
  });
});
