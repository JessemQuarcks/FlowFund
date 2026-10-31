import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import type {
  ReviewVerificationInput,
  SubmitVerificationInput,
} from "@/schemas/verification";
import {
  ADMIN_QUEUE_PAGE_SIZE,
  type VerificationStatusFilter,
} from "@/schemas/admin";

export type VerificationState = {
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  latest: {
    status: string;
    reviewNotes: string | null;
    dateAdded: string;
  } | null;
};

// Last four characters of an ID, kept for reference after the full number is
// purged. Non-alphanumerics are stripped first so spacing/dashes don't matter.
function lastFour(idNumber: string): string {
  return idNumber.replace(/[^A-Za-z0-9]/g, "").slice(-4);
}

// An organiser submits their KYC details for review. Blocked once verified.
export async function submitVerification(
  userId: string,
  input: SubmitVerificationInput,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verificationStatus: true },
  });
  if (!user) throw errors.notFound("User not found");
  if (user.verificationStatus === "VERIFIED") {
    throw errors.conflict("Your account is already verified");
  }

  const [request] = await prisma.$transaction([
    prisma.verificationRequest.create({
      data: {
        userId,
        fullName: input.fullName,
        phone: input.phone,
        idType: input.idType,
        idNumber: input.idNumber,
        idNumberLast4: lastFour(input.idNumber),
        status: "PENDING",
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { verificationStatus: "PENDING" },
    }),
  ]);

  return { id: request.id, status: request.status };
}

export async function getVerificationState(
  userId: string,
): Promise<VerificationState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { verificationStatus: true },
  });
  if (!user) throw errors.notFound("User not found");

  const latest = await prisma.verificationRequest.findFirst({
    where: { userId },
    orderBy: { dateAdded: "desc" },
    select: { status: true, reviewNotes: true, dateAdded: true },
  });

  return {
    status: user.verificationStatus,
    latest: latest
      ? {
          status: latest.status,
          reviewNotes: latest.reviewNotes,
          dateAdded: latest.dateAdded.toISOString(),
        }
      : null,
  };
}

// Admin queue of pending KYC submissions.
export async function listAdminVerifications(params: {
  q?: string;
  page: number;
  status: VerificationStatusFilter;
}) {
  const where: Prisma.VerificationRequestWhereInput = {};
  if (params.status !== "all") where.status = params.status;
  if (params.q) {
    where.OR = [
      { fullName: { contains: params.q, mode: "insensitive" } },
      { phone: { contains: params.q, mode: "insensitive" } },
      { idType: { contains: params.q, mode: "insensitive" } },
      { user: { name: { contains: params.q, mode: "insensitive" } } },
      { user: { email: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  const total = await prisma.verificationRequest.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_QUEUE_PAGE_SIZE));
  const page = Math.min(params.page, totalPages);
  const items = await prisma.verificationRequest.findMany({
    where,
    orderBy: [{ dateAdded: "asc" }, { id: "asc" }],
    skip: (page - 1) * ADMIN_QUEUE_PAGE_SIZE,
    take: ADMIN_QUEUE_PAGE_SIZE,
    select: {
      id: true,
      userId: true,
      fullName: true,
      phone: true,
      idType: true,
      idNumberLast4: true,
      status: true,
      dateAdded: true,
      user: { select: { id: true, name: true, email: true } },
    },
  });
  return { items, total, page, totalPages, perPage: ADMIN_QUEUE_PAGE_SIZE };
}

export async function viewVerificationIdentity(
  adminId: string,
  requestId: string,
) {
  return prisma.$transaction(async (tx) => {
    const request = await tx.verificationRequest.findUnique({
      where: { id: requestId },
      select: {
        idType: true,
        idNumber: true,
        idNumberLast4: true,
        userId: true,
      },
    });
    if (!request) throw errors.notFound("Verification request not found");

    await tx.auditLog.create({
      data: {
        action: "verification.identity_viewed",
        actorUserId: adminId,
        // Minimal: never copy the ID value into the log.
        detail: {
          verificationRequestId: requestId,
          targetUserId: request.userId,
          redacted: request.idNumber === null,
        },
      },
    });

    // Full number only while retained (PENDING); otherwise just the last four.
    return {
      idType: request.idType,
      idNumber: request.idNumber,
      idNumberLast4: request.idNumberLast4,
    };
  });
}

// Admin approves or rejects a submission. Approval marks the organiser
// verified (and flips the public badge); both outcomes are logged.
export async function reviewVerification(
  adminId: string,
  requestId: string,
  input: ReviewVerificationInput,
) {
  const request = await prisma.verificationRequest.findUnique({
    where: { id: requestId },
  });
  if (!request) throw errors.notFound("Verification request not found");

  // State-aware: only a pending request can be reviewed. A stale or repeated
  // decision is rejected rather than silently overwriting the outcome.
  if (request.status !== "PENDING") {
    throw errors.conflict("This verification has already been reviewed");
  }

  const approved = input.decision === "approve";
  const status = approved ? "VERIFIED" : "REJECTED";

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: {
        status,
        reviewNotes: input.notes,
        reviewedById: adminId,
        // Retention: purge the full ID once a decision is made; keep only the
        // last four for reference.
        idNumber: null,
      },
    }),
    prisma.user.update({
      where: { id: request.userId },
      data: {
        verificationStatus: status,
        isVerifiedOrganiser: approved,
      },
    }),
    prisma.auditLog.create({
      data: {
        action: approved ? "verification.approved" : "verification.rejected",
        actorUserId: adminId,
        detail: {
          verificationRequestId: requestId,
          targetUserId: request.userId,
          from: request.status,
          to: status,
          reason: input.notes ?? null,
        },
      },
    }),
  ]);

  return { status };
}
