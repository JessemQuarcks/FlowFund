import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type {
  ReviewVerificationInput,
  SubmitVerificationInput,
} from "@/schemas/verification";

export type VerificationState = {
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  latest: {
    status: string;
    reviewNotes: string | null;
    dateAdded: string;
  } | null;
};

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
export async function listPendingVerifications() {
  return prisma.verificationRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { dateAdded: "asc" },
    include: { user: { select: { id: true, name: true, email: true } } },
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

  const approved = input.decision === "approve";
  const status = approved ? "VERIFIED" : "REJECTED";

  await prisma.$transaction([
    prisma.verificationRequest.update({
      where: { id: requestId },
      data: { status, reviewNotes: input.notes, reviewedById: adminId },
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
          notes: input.notes ?? null,
        },
      },
    }),
  ]);

  return { status };
}
