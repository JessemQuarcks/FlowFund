import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import { verifyTransaction } from "@/lib/paystack";
import type { VerifyDonationInput } from "@/schemas/donation";

// What callers may see of a donation. Never return the stored Paystack
// payload: it holds the card authorization.
export type PublicDonation = { id: string; amount: number };

function toPublic(donation: { id: string; amount: number }): PublicDonation {
  return { id: donation.id, amount: donation.amount };
}

// A reference is recorded once. Repeat calls (client retries) get the
// existing donation back instead of adding to the total again.
function alreadyRecorded(
  donation: { id: string; amount: number; fundraiserId: string },
  fundraiserId: string,
): PublicDonation {
  if (donation.fundraiserId !== fundraiserId) {
    throw errors.conflict("Payment reference already used");
  }
  return toPublic(donation);
}

function isPrismaError(error: unknown, ...codes: string[]) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    codes.includes(error.code)
  );
}

// Confirms a payment with Paystack and records it against the fundraiser
// exactly once.
export async function recordVerifiedDonation({
  reference,
  fundraiserId,
  donorInfo,
}: VerifyDonationInput): Promise<PublicDonation> {
  const existing = await prisma.donation.findUnique({ where: { reference } });
  if (existing) return alreadyRecorded(existing, fundraiserId);

  const paymentData = await verifyTransaction(reference);
  const payment = paymentData?.data;
  if (!paymentData?.status || payment?.status !== "success") {
    throw errors.paymentFailed("Payment verification failed");
  }

  const metadata =
    payment.metadata && typeof payment.metadata === "object"
      ? payment.metadata
      : {};
  if (
    payment.currency !== "GHS" ||
    payment.reference !== reference ||
    metadata.fundraiser_id !== fundraiserId
  ) {
    throw errors.paymentFailed("Payment does not match this fundraiser");
  }

  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: fundraiserId },
  });
  if (!fundraiser) throw errors.notFound("Fundraiser not found");

  const amount = payment.amount / 100; // Convert from pesewas

  // The money has already been captured, so a below-minimum payment is
  // still recorded. The donation form enforces the minimum; server-side
  // enforcement needs server-initialised transactions (roadmap Phase 2).
  if (amount < fundraiser.minimumAmount) {
    console.warn(
      `Donation ${reference} of ${amount} is below the minimum of ${fundraiser.minimumAmount} for fundraiser ${fundraiserId}`,
    );
  }

  const recordDonation = () =>
    prisma.$transaction(
      async (tx) => {
        // Lock the fundraiser row first so concurrent donations to the same
        // fundraiser queue up instead of deadlocking (the donation insert's
        // foreign key check would otherwise share-lock it first).
        await tx.fundraiser.update({
          where: { id: fundraiserId },
          data: { raisedAmount: { increment: amount } },
        });

        // Anonymous donations always count as a new donor; named donors are
        // counted once per fundraiser by email.
        const isNewDonor = donorInfo?.email
          ? (await tx.donation.count({
              where: { fundraiserId, donorEmail: donorInfo.email },
            })) === 0
          : true;

        const created = await tx.donation.create({
          data: {
            reference,
            amount,
            // Stored as received, for reconciliation.
            paymentDetails: paymentData as unknown as Prisma.InputJsonObject,
            donorFirstName: donorInfo?.firstName,
            donorLastName: donorInfo?.lastName,
            donorEmail: donorInfo?.email,
            fundraiserId,
          },
        });

        if (isNewDonor) {
          await tx.fundraiser.update({
            where: { id: fundraiserId },
            data: { donorCount: { increment: 1 } },
          });
        }

        return created;
      },
      // READ COMMITTED so the donor count, read after the fundraiser lock is
      // held, sees donations committed by transactions that held it before.
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );

  try {
    // The payment is already captured, so retry deadlocks rather than
    // dropping the record.
    for (let attempt = 1; ; attempt++) {
      try {
        return toPublic(await recordDonation());
      } catch (error) {
        if (!isPrismaError(error, "P2034") || attempt >= 3) throw error;
      }
    }
  } catch (error) {
    // Two concurrent requests for the same reference: the unique index lets
    // only one insert through (P2002), or MySQL resolves the clash as a
    // deadlock (P2034). Either way the winner's record is returned.
    if (isPrismaError(error, "P2002", "P2034")) {
      const winner = await prisma.donation.findUnique({ where: { reference } });
      if (winner) return alreadyRecorded(winner, fundraiserId);
    }
    throw error;
  }
}
