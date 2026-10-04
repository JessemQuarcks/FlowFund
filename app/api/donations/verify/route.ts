import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { Prisma } from "@/lib/generated/prisma";
import { getClientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

const verifySchema = z.object({
  reference: z.string().trim().min(1).max(100),
  fundraiserId: z.string().min(1),
  donorInfo: z
    .object({
      firstName: z.string().trim().min(1).max(100),
      lastName: z.string().trim().min(1).max(100),
      email: z.string().trim().email().max(254),
    })
    .nullable(),
});

type PaystackVerifyResponse = {
  status: boolean;
  data?: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    metadata?: { fundraiser_id?: string } | string | null;
  };
};

// Never return the stored Paystack payload: it holds the card authorization.
function publicDonation(donation: { id: string; amount: number }) {
  return { id: donation.id, amount: donation.amount };
}

function alreadyRecorded(
  donation: { id: string; amount: number; fundraiserId: string },
  fundraiserId: string,
) {
  if (donation.fundraiserId !== fundraiserId) {
    return NextResponse.json(
      { message: "Payment reference already used" },
      { status: 409 },
    );
  }
  return NextResponse.json(
    { success: true, donation: publicDonation(donation) },
    { status: 200 },
  );
}

export async function POST(request: Request) {
  const limit = rateLimit(
    `verify:ip:${getClientIp(request.headers)}`,
    30,
    10 * 60 * 1000,
  );
  if (!limit.success) return tooManyRequests(limit);

  const parsed = verifySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid request" }, { status: 400 });
  }
  const { reference, fundraiserId, donorInfo } = parsed.data;

  try {
    // A reference is recorded once. Repeat calls (client retries) get the
    // existing donation back instead of adding to the total again.
    const existing = await prisma.donation.findUnique({
      where: { reference },
    });
    if (existing) return alreadyRecorded(existing, fundraiserId);

    // Verify payment with Paystack
    const response = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store",
      },
    );
    const paymentData: PaystackVerifyResponse = await response.json();
    const payment = paymentData.data;

    if (!response.ok || !paymentData.status || payment?.status !== "success") {
      return NextResponse.json(
        { message: "Payment verification failed" },
        { status: 400 },
      );
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
      return NextResponse.json(
        { message: "Payment does not match this fundraiser" },
        { status: 400 },
      );
    }

    const fundraiser = await prisma.fundraiser.findUnique({
      where: { id: fundraiserId },
    });
    if (!fundraiser) {
      return NextResponse.json(
        { message: "Fundraiser not found" },
        { status: 404 },
      );
    }

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
              paymentDetails: paymentData,
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
          // READ COMMITTED so the donor count, read after the fundraiser lock is
          // held, sees donations committed by transactions that held it before.
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );

    // The payment is already captured, so retry deadlocks rather than
    // dropping the record.
    let donation;
    for (let attempt = 1; ; attempt++) {
      try {
        donation = await recordDonation();
        break;
      } catch (error) {
        const isDeadlock =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2034";
        if (!isDeadlock || attempt >= 3) throw error;
      }
    }

    return NextResponse.json(
      { success: true, donation: publicDonation(donation) },
      { status: 200 },
    );
  } catch (error) {
    // Two concurrent requests for the same reference: the unique index lets
    // only one insert through (P2002), or MySQL resolves the clash as a
    // deadlock (P2034). Either way the winner's record is returned.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2034")
    ) {
      const existing = await prisma.donation.findUnique({
        where: { reference },
      });
      if (existing) return alreadyRecorded(existing, fundraiserId);
    }

    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
