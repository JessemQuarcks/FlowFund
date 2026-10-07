import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma, type Withdrawal_Status } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import { initiateTransfer } from "@/lib/paystack";
import { toMinorUnits } from "@/lib/money";
import { getOwnedPayoutAccount } from "@/lib/services/payout-accounts";
import type { RequestWithdrawalInput } from "@/schemas/withdrawal";

export type PublicWithdrawal = {
  id: string;
  amount: number;
  status: Withdrawal_Status;
  reference: string;
};

// Money is counted against the balance while a withdrawal is in these states,
// and released again when it fails or is reversed.
const RESERVED_STATES: ReadonlySet<Withdrawal_Status> = new Set([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
]);

function toPublic(w: {
  id: string;
  amount: number;
  status: Withdrawal_Status;
  reference: string | null;
}): PublicWithdrawal {
  return {
    id: w.id,
    amount: w.amount,
    status: w.status,
    reference: w.reference ?? "",
  };
}

async function releaseReservation(
  id: string,
  fundraiserId: string,
  amount: number,
) {
  await prisma.$transaction([
    prisma.withdrawal.update({ where: { id }, data: { status: "FAILED" } }),
    prisma.fundraiser.update({
      where: { id: fundraiserId },
      data: { totalWithdrawn: { decrement: amount } },
    }),
  ]);
}

// Requests a payout. The balance check and the debit happen inside one
// transaction with the fundraiser row locked (SELECT … FOR UPDATE), so two
// concurrent requests cannot both pass the check and overdraw. The money is
// reserved immediately (totalWithdrawn goes up) and the transfer is then sent;
// the final status is settled by the transfer webhooks.
export async function requestWithdrawal(
  userId: string,
  input: RequestWithdrawalInput,
): Promise<PublicWithdrawal> {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: input.fundraiserId },
    include: { event: { select: { userId: true, title: true } } },
  });
  if (!fundraiser) throw errors.notFound("Fundraiser not found");
  if (fundraiser.event.userId !== userId) throw errors.forbidden();

  const payoutAccount = await getOwnedPayoutAccount(
    userId,
    input.payoutAccountId,
  );

  const amount = toMinorUnits(input.amount);
  if (amount <= 0) throw errors.badRequest("Enter a valid amount");

  const reference = `wd_${randomUUID()}`;

  const withdrawal = await prisma.$transaction(
    async (tx) => {
      // Lock the fundraiser row for the length of the transaction so a
      // concurrent withdrawal waits here and sees this reservation.
      const rows = await tx.$queryRaw<
        { raisedAmount: number; totalWithdrawn: number }[]
      >(
        Prisma.sql`SELECT raisedAmount, totalWithdrawn FROM Fundraiser WHERE id = ${input.fundraiserId} FOR UPDATE`,
      );
      const current = rows[0];
      if (!current) throw errors.notFound("Fundraiser not found");

      const available = current.raisedAmount - current.totalWithdrawn;
      if (amount > available) {
        throw errors.badRequest("Amount is more than the available balance");
      }

      const created = await tx.withdrawal.create({
        data: {
          amount,
          currency: fundraiser.currency,
          fundraiserId: fundraiser.id,
          userId,
          accountType: payoutAccount.accountType,
          recipientCode: payoutAccount.recipientCode,
          payoutAccountId: payoutAccount.id,
          status: "PENDING",
          reference,
          notes: input.notes,
          paymentDetails: {},
        },
      });

      await tx.fundraiser.update({
        where: { id: fundraiser.id },
        data: { totalWithdrawn: { increment: amount } },
      });

      return created;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
  );

  // The money is reserved. Send the transfer; if Paystack rejects it, release
  // the reservation and surface the error.
  let transfer;
  try {
    transfer = await initiateTransfer({
      amount,
      recipient: payoutAccount.recipientCode,
      reference,
      reason: input.notes ?? `Withdrawal for ${fundraiser.event.title}`,
      currency: fundraiser.currency,
    });
  } catch (error) {
    await releaseReservation(withdrawal.id, fundraiser.id, amount);
    throw error;
  }

  const updated = await prisma.withdrawal.update({
    where: { id: withdrawal.id },
    data: {
      status: "PROCESSING",
      paymentDetails: transfer as unknown as Prisma.InputJsonObject,
    },
  });

  return toPublic(updated);
}

// Settles a withdrawal when a transfer webhook arrives. Idempotent: a repeated
// webhook or an out-of-order one leaves the balance correct, because funds are
// released exactly on the move from a reserved state to a released one.
export async function finalizeTransfer(
  reference: string,
  outcome: "success" | "failed" | "reversed",
) {
  const target: Withdrawal_Status =
    outcome === "success"
      ? "COMPLETED"
      : outcome === "reversed"
        ? "REVERSED"
        : "FAILED";

  await prisma.$transaction(async (tx) => {
    const w = await tx.withdrawal.findUnique({ where: { reference } });
    if (!w || w.status === target) return;

    const wasReserved = RESERVED_STATES.has(w.status);
    const willReserve = RESERVED_STATES.has(target);

    await tx.withdrawal.update({
      where: { id: w.id },
      data: { status: target },
    });

    if (wasReserved && !willReserve) {
      await tx.fundraiser.update({
        where: { id: w.fundraiserId },
        data: { totalWithdrawn: { decrement: w.amount } },
      });
    } else if (!wasReserved && willReserve) {
      await tx.fundraiser.update({
        where: { id: w.fundraiserId },
        data: { totalWithdrawn: { increment: w.amount } },
      });
    }
  });
}
