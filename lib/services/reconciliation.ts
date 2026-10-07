import { prisma } from "@/lib/prisma";
import { verifyTransaction, verifyTransfer } from "@/lib/paystack";
import type { Prisma, Withdrawal_Status } from "@/lib/generated/prisma";

// A single disagreement found between our ledger and either Paystack or our own
// counters. Reconciliation reports these; alerting on them is Phase 5.
export type Drift = {
  kind: "donation" | "withdrawal" | "fundraiser_counters";
  id: string;
  reference?: string | null;
  issue: string;
  expected?: unknown;
  actual?: unknown;
};

export type ReconciliationReport = {
  checkedDonations: number;
  checkedWithdrawals: number;
  checkedFundraisers: number;
  drifts: Drift[];
  hasDrift: boolean;
};

// Withdrawal states whose amount is counted against the balance.
const RESERVED: Withdrawal_Status[] = ["PENDING", "PROCESSING", "COMPLETED"];

// What a Paystack transfer status implies our withdrawal status should be.
const EXPECTED_WITHDRAWAL_STATUS: Record<string, Withdrawal_Status> = {
  success: "COMPLETED",
  failed: "FAILED",
  reversed: "REVERSED",
};

// Checks that each fundraiser's stored counters equal the sum of its ledger
// rows. Pure database work: it catches a counter that drifted from the rows
// that should define it, independent of Paystack.
export async function reconcileFundraiserCounters(): Promise<Drift[]> {
  const drifts: Drift[] = [];
  const fundraisers = await prisma.fundraiser.findMany({
    select: {
      id: true,
      raisedAmount: true,
      totalWithdrawn: true,
      donorCount: true,
    },
  });

  for (const f of fundraisers) {
    const raised = await prisma.donation.aggregate({
      _sum: { amount: true },
      where: { fundraiserId: f.id },
    });
    const expectedRaised = raised._sum.amount ?? 0;
    if (expectedRaised !== f.raisedAmount) {
      drifts.push({
        kind: "fundraiser_counters",
        id: f.id,
        issue: "raisedAmount does not equal the sum of donations",
        expected: expectedRaised,
        actual: f.raisedAmount,
      });
    }

    const withdrawn = await prisma.withdrawal.aggregate({
      _sum: { amount: true },
      where: { fundraiserId: f.id, status: { in: RESERVED } },
    });
    const expectedWithdrawn = withdrawn._sum.amount ?? 0;
    if (expectedWithdrawn !== f.totalWithdrawn) {
      drifts.push({
        kind: "fundraiser_counters",
        id: f.id,
        issue: "totalWithdrawn does not equal the sum of reserved withdrawals",
        expected: expectedWithdrawn,
        actual: f.totalWithdrawn,
      });
    }

    // Named donors count once per email; anonymous donations each count.
    const donations = await prisma.donation.findMany({
      where: { fundraiserId: f.id },
      select: { donorEmail: true },
    });
    const namedEmails = new Set<string>();
    let anonymous = 0;
    for (const d of donations) {
      if (d.donorEmail) namedEmails.add(d.donorEmail);
      else anonymous += 1;
    }
    const expectedDonorCount = namedEmails.size + anonymous;
    if (expectedDonorCount !== f.donorCount) {
      drifts.push({
        kind: "fundraiser_counters",
        id: f.id,
        issue: "donorCount does not match the donations",
        expected: expectedDonorCount,
        actual: f.donorCount,
      });
    }
  }

  return drifts;
}

// Checks each recorded donation against the Paystack transaction it came from,
// to the pesewa. `limit` bounds how many (most recent first) to re-verify.
export async function reconcileDonationsAgainstPaystack(
  limit = 500,
): Promise<{ checked: number; drifts: Drift[] }> {
  const donations = await prisma.donation.findMany({
    where: { reference: { not: null } },
    orderBy: { dateAdded: "desc" },
    take: limit,
    select: { id: true, reference: true, amount: true, currency: true },
  });

  const drifts: Drift[] = [];
  for (const d of donations) {
    const reference = d.reference!;
    const result = await verifyTransaction(reference);
    const payment = result?.data;
    if (!result?.status || !payment) {
      drifts.push({
        kind: "donation",
        id: d.id,
        reference,
        issue: "recorded donation not found at Paystack",
      });
      continue;
    }
    if (payment.status !== "success") {
      drifts.push({
        kind: "donation",
        id: d.id,
        reference,
        issue: "Paystack does not report this charge as successful",
        actual: payment.status,
      });
    }
    if (payment.amount !== d.amount) {
      drifts.push({
        kind: "donation",
        id: d.id,
        reference,
        issue: "amount differs from Paystack",
        expected: payment.amount,
        actual: d.amount,
      });
    }
    if (payment.currency !== d.currency) {
      drifts.push({
        kind: "donation",
        id: d.id,
        reference,
        issue: "currency differs from Paystack",
        expected: payment.currency,
        actual: d.currency,
      });
    }
  }

  return { checked: donations.length, drifts };
}

// Checks each withdrawal that has a transfer reference against the Paystack
// transfer, comparing amount and the status the transfer implies.
export async function reconcileWithdrawalsAgainstPaystack(
  limit = 500,
): Promise<{ checked: number; drifts: Drift[] }> {
  const withdrawals = await prisma.withdrawal.findMany({
    where: { reference: { not: null } },
    orderBy: { dateAdded: "desc" },
    take: limit,
    select: { id: true, reference: true, amount: true, status: true },
  });

  const drifts: Drift[] = [];
  for (const w of withdrawals) {
    const reference = w.reference!;
    const transfer = await verifyTransfer(reference);
    if (!transfer) {
      // Only a problem if we believe the money left.
      if (w.status === "PROCESSING" || w.status === "COMPLETED") {
        drifts.push({
          kind: "withdrawal",
          id: w.id,
          reference,
          issue: "withdrawal marked sent but Paystack has no such transfer",
          actual: w.status,
        });
      }
      continue;
    }
    if (transfer.amount !== w.amount) {
      drifts.push({
        kind: "withdrawal",
        id: w.id,
        reference,
        issue: "amount differs from Paystack",
        expected: transfer.amount,
        actual: w.amount,
      });
    }
    const expectedStatus = EXPECTED_WITHDRAWAL_STATUS[transfer.status];
    if (expectedStatus && expectedStatus !== w.status) {
      drifts.push({
        kind: "withdrawal",
        id: w.id,
        reference,
        issue: "status disagrees with Paystack",
        expected: expectedStatus,
        actual: w.status,
      });
    }
  }

  return { checked: withdrawals.length, drifts };
}

// Runs every check, records the outcome in the audit log (a run entry always,
// a drift entry per disagreement) and returns the report. Scheduling this is a
// thin wrapper (see /api/cron/reconcile); the logic here is independent of how
// it is triggered.
export async function reconcile(
  options: { donationLimit?: number; withdrawalLimit?: number } = {},
): Promise<ReconciliationReport> {
  const counterDrifts = await reconcileFundraiserCounters();
  const donations = await reconcileDonationsAgainstPaystack(
    options.donationLimit,
  );
  const withdrawals = await reconcileWithdrawalsAgainstPaystack(
    options.withdrawalLimit,
  );

  const checkedFundraisers = await prisma.fundraiser.count();
  const drifts = [...counterDrifts, ...donations.drifts, ...withdrawals.drifts];
  const report: ReconciliationReport = {
    checkedDonations: donations.checked,
    checkedWithdrawals: withdrawals.checked,
    checkedFundraisers,
    drifts,
    hasDrift: drifts.length > 0,
  };

  if (report.hasDrift) {
    console.error(
      `Reconciliation found ${drifts.length} drift(s):`,
      JSON.stringify(drifts),
    );
  }

  await prisma.auditLog.create({
    data: {
      action: "reconciliation.run",
      detail: {
        checkedDonations: report.checkedDonations,
        checkedWithdrawals: report.checkedWithdrawals,
        checkedFundraisers: report.checkedFundraisers,
        driftCount: drifts.length,
      },
    },
  });
  if (drifts.length > 0) {
    await prisma.auditLog.createMany({
      data: drifts.map((d) => ({
        action: "reconciliation.drift",
        fundraiserId: d.kind === "fundraiser_counters" ? d.id : undefined,
        donationId: d.kind === "donation" ? d.id : undefined,
        withdrawalId: d.kind === "withdrawal" ? d.id : undefined,
        reference: d.reference ?? undefined,
        detail: d as unknown as Prisma.InputJsonObject,
      })),
    });
  }

  return report;
}
