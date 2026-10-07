import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import {
  initializeTransaction,
  verifyTransaction,
  type PaystackTransaction,
} from "@/lib/paystack";
import { toMinorUnits } from "@/lib/money";
import type { InitializeDonationInput } from "@/schemas/donation";

// What callers may see of a donation. Never return the stored Paystack
// payload: it holds the card authorization.
export type PublicDonation = { id: string; amount: number };

// What the server writes into Paystack metadata when it starts a transaction,
// and reads back when it records the donation. The amount, fundraiser and
// donor are fixed here by the server, never trusted from the browser later.
type DonorDetails = { firstName: string; lastName: string; email: string };
type DonationMetadata = {
  fundraiser_id: string;
  is_anonymous: boolean;
  donor: DonorDetails | null;
  // The signed-in user who donated, if any. Set by the server at initialise.
  user_id?: string | null;
  event_title?: string;
};

function toPublic(donation: { id: string; amount: number }): PublicDonation {
  return { id: donation.id, amount: donation.amount };
}

function isPrismaError(error: unknown, ...codes: string[]) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    codes.includes(error.code)
  );
}

// Paystack returns metadata as the object we sent, but may deliver it as a JSON
// string. Reads back the fields the server set; returns null if they are
// missing or malformed (a payment we cannot attribute).
function readDonationMetadata(
  raw: PaystackTransaction["metadata"],
): DonationMetadata | null {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const meta = value as Record<string, unknown>;
  if (typeof meta.fundraiser_id !== "string") return null;
  const donor =
    meta.donor && typeof meta.donor === "object"
      ? (meta.donor as DonorDetails)
      : null;
  return {
    fundraiser_id: meta.fundraiser_id,
    is_anonymous: Boolean(meta.is_anonymous),
    donor,
    user_id: typeof meta.user_id === "string" ? meta.user_id : null,
  };
}

// Starts a donation on the server: validates the fundraiser is still open and
// the amount is allowed, then asks Paystack to initialise a transaction with a
// server-generated reference and the donor details locked into the metadata.
export async function initializeDonation(
  input: InitializeDonationInput,
  userId?: string,
) {
  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: input.fundraiserId },
    include: { event: { select: { title: true } } },
  });
  if (!fundraiser) throw errors.notFound("Fundraiser not found");

  if (fundraiser.endDate.getTime() <= Date.now()) {
    throw errors.badRequest("This fundraiser has ended");
  }

  const amount = toMinorUnits(input.amount);
  if (amount < fundraiser.minimumAmount) {
    throw errors.badRequest(
      "Donation is below the minimum for this fundraiser",
    );
  }

  const reference = `ff_${randomUUID()}`;
  const donor: DonorDetails | null =
    input.isAnonymous || !input.firstName || !input.lastName
      ? null
      : {
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
        };
  const metadata: DonationMetadata = {
    fundraiser_id: fundraiser.id,
    is_anonymous: input.isAnonymous,
    donor,
    user_id: userId ?? null,
    event_title: fundraiser.event.title,
  };

  const { access_code, authorization_url } = await initializeTransaction({
    email: input.email,
    amount,
    currency: fundraiser.currency,
    reference,
    metadata,
  });

  return {
    reference,
    accessCode: access_code,
    authorizationUrl: authorization_url,
  };
}

// Records the payment behind a reference against its fundraiser exactly once.
// The amount, fundraiser and donor all come from Paystack (the verified
// transaction and the server-set metadata), never from the caller. Safe to
// call more than once and from more than one source (the client confirmation
// and the webhook both land here); the unique reference keeps it idempotent.
export async function recordDonationByReference(
  reference: string,
): Promise<PublicDonation> {
  const existing = await prisma.donation.findUnique({ where: { reference } });
  if (existing) return toPublic(existing);

  const paymentData = await verifyTransaction(reference);
  const payment = paymentData?.data;
  if (!paymentData?.status || payment?.status !== "success") {
    throw errors.paymentFailed("Payment verification failed");
  }

  const metadata = readDonationMetadata(payment.metadata);
  if (!metadata || payment.reference !== reference) {
    throw errors.paymentFailed("Payment metadata is missing or invalid");
  }

  const fundraiser = await prisma.fundraiser.findUnique({
    where: { id: metadata.fundraiser_id },
  });
  if (!fundraiser) throw errors.notFound("Fundraiser not found");

  // Paystack reports the amount in the currency's minor unit (pesewas for
  // GHS), which is exactly how we store it.
  if (payment.currency !== fundraiser.currency) {
    throw errors.paymentFailed(
      "Payment currency does not match the fundraiser",
    );
  }
  const amount = payment.amount;
  const donor = metadata.is_anonymous ? null : metadata.donor;

  // The minimum is enforced before the money is taken (initializeDonation);
  // this only flags a payment that somehow arrived below it, which we still
  // record because the money has already been captured.
  if (amount < fundraiser.minimumAmount) {
    console.warn(
      `Donation ${reference} of ${amount} is below the minimum of ${fundraiser.minimumAmount} for fundraiser ${fundraiser.id}`,
    );
  }

  const recordDonation = () =>
    prisma.$transaction(
      async (tx) => {
        // Lock the fundraiser row first so concurrent donations to the same
        // fundraiser queue up instead of deadlocking (the donation insert's
        // foreign key check would otherwise share-lock it first).
        await tx.fundraiser.update({
          where: { id: fundraiser.id },
          data: { raisedAmount: { increment: amount } },
        });

        // Anonymous donations always count as a new donor; named donors are
        // counted once per fundraiser by email.
        const isNewDonor = donor?.email
          ? (await tx.donation.count({
              where: { fundraiserId: fundraiser.id, donorEmail: donor.email },
            })) === 0
          : true;

        const created = await tx.donation.create({
          data: {
            reference,
            amount,
            currency: fundraiser.currency,
            // Stored as received, for reconciliation.
            paymentDetails: paymentData as unknown as Prisma.InputJsonObject,
            isAnonymous: metadata.is_anonymous,
            userId: metadata.user_id ?? undefined,
            donorFirstName: donor?.firstName,
            donorLastName: donor?.lastName,
            donorEmail: donor?.email,
            fundraiserId: fundraiser.id,
          },
        });

        if (isNewDonor) {
          await tx.fundraiser.update({
            where: { id: fundraiser.id },
            data: { donorCount: { increment: 1 } },
          });
        }

        await tx.auditLog.create({
          data: {
            action: "donation.recorded",
            fundraiserId: fundraiser.id,
            donationId: created.id,
            amount, // credited to the raised total
            currency: fundraiser.currency,
            reference,
            detail: { anonymous: metadata.is_anonymous, newDonor: isNewDonor },
          },
        });

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
    // Two concurrent calls for the same reference: the unique index lets only
    // one insert through (P2002), or MySQL resolves the clash as a deadlock
    // (P2034). Either way the winner's record is returned.
    if (isPrismaError(error, "P2002", "P2034")) {
      const winner = await prisma.donation.findUnique({ where: { reference } });
      if (winner) return toPublic(winner);
    }
    throw error;
  }
}

// A donor as shown publicly on an event's Donors tab. Anonymity is honoured
// here (no name) and the email is never exposed.
export type PublicDonor = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
};

export type DonorSort = "recent" | "highest" | "lowest";

// Lists an event's donors, paginated, respecting each donation's anonymity.
export async function listDonors(
  eventId: string,
  { page = 1, sort = "recent" }: { page?: number; sort?: DonorSort } = {},
) {
  const perPage = 10;
  const safePage = Math.max(1, page);
  const orderBy: Prisma.DonationOrderByWithRelationInput =
    sort === "highest"
      ? { amount: "desc" }
      : sort === "lowest"
        ? { amount: "asc" }
        : { dateAdded: "desc" };
  const where: Prisma.DonationWhereInput = { fundraiser: { eventId } };

  const [rows, total] = await Promise.all([
    prisma.donation.findMany({
      where,
      orderBy,
      skip: (safePage - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        amount: true,
        currency: true,
        dateAdded: true,
        isAnonymous: true,
        donorFirstName: true,
        donorLastName: true,
      },
    }),
    prisma.donation.count({ where }),
  ]);

  const donors: PublicDonor[] = rows.map((r) => ({
    id: r.id,
    name: r.isAnonymous
      ? "Anonymous"
      : [r.donorFirstName, r.donorLastName].filter(Boolean).join(" ") ||
        "Anonymous",
    amount: r.amount,
    currency: r.currency,
    date: r.dateAdded.toISOString(),
  }));

  return {
    donors,
    total,
    page: safePage,
    perPage,
    totalPages: Math.max(1, Math.ceil(total / perPage)),
  };
}
