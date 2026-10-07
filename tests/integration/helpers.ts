import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function resetDatabase() {
  // Children before parents: the foreign keys have no cascade.
  await prisma.$transaction([
    prisma.auditLog.deleteMany(),
    prisma.update.deleteMany(),
    prisma.donation.deleteMany(),
    prisma.withdrawal.deleteMany(),
    prisma.payoutAccount.deleteMany(),
    prisma.fundraiser.deleteMany(),
    prisma.event.deleteMany(),
    prisma.session.deleteMany(),
    prisma.account.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}

export function createUser(email = `${randomUUID()}@example.com`) {
  return prisma.user.create({ data: { email, name: "Test Organiser" } });
}

const inAWeek = () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

export async function createEventWithFundraiser(
  userId: string,
  fundraiser: { minimumAmount?: number; image?: string } = {},
) {
  return prisma.event.create({
    data: {
      userId,
      title: "Community clean-up",
      description: "Clearing the beach",
      category: "COMMUNITY",
      date: inAWeek(),
      fundraiser: {
        create: {
          targetAmount: 10_000,
          minimumAmount: fundraiser.minimumAmount ?? 1,
          endDate: inAWeek(),
          anonymity: false,
          image: fundraiser.image,
          raisedAmount: 0,
          donorCount: 0,
          totalWithdrawn: 0,
        },
      },
    },
    include: { fundraiser: true },
  });
}
