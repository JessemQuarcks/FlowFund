import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import type { CreateReportInput } from "@/schemas/moderation";

// ---------- Reports (public create, admin resolve) ----------

export async function createReport(eventId: string, input: CreateReportInput) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) throw errors.notFound("Campaign not found");

  await prisma.report.create({
    data: {
      eventId,
      reason: input.reason,
      details: input.details,
      reporterEmail: input.reporterEmail || undefined,
    },
  });
}

export async function listReports(
  status: "OPEN" | "ACTIONED" | "DISMISSED" = "OPEN",
) {
  return prisma.report.findMany({
    where: { status },
    orderBy: { dateAdded: "desc" },
    include: { event: { select: { id: true, title: true, status: true } } },
  });
}

// Admin dismisses a report or suspends the reported campaign.
export async function resolveReport(
  adminId: string,
  reportId: string,
  action: "dismiss" | "suspend",
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw errors.notFound("Report not found");

  if (action === "suspend") {
    await prisma.$transaction([
      prisma.event.update({
        where: { id: report.eventId },
        data: { status: "SUSPENDED" },
      }),
      prisma.report.update({
        where: { id: reportId },
        data: { status: "ACTIONED" },
      }),
      prisma.auditLog.create({
        data: {
          action: "campaign.suspended",
          actorUserId: adminId,
          detail: { eventId: report.eventId, reportId, via: "report" },
        },
      }),
    ]);
  } else {
    await prisma.report.update({
      where: { id: reportId },
      data: { status: "DISMISSED" },
    });
  }
}

// ---------- Campaign moderation ----------

export async function setEventStatus(
  adminId: string,
  eventId: string,
  status: "ACTIVE" | "SUSPENDED",
) {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  if (!event) throw errors.notFound("Campaign not found");

  await prisma.$transaction([
    prisma.event.update({ where: { id: eventId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        action:
          status === "SUSPENDED" ? "campaign.suspended" : "campaign.reinstated",
        actorUserId: adminId,
        detail: { eventId },
      },
    }),
  ]);
}

// ---------- Users ----------

export async function setUserBanned(
  adminId: string,
  userId: string,
  banned: boolean,
) {
  if (userId === adminId) {
    throw errors.badRequest("You cannot ban your own account");
  }
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (!user) throw errors.notFound("User not found");
  if (user.role === "ADMIN") {
    throw errors.badRequest("Admins cannot be banned");
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { isBanned: banned } }),
    prisma.auditLog.create({
      data: {
        action: banned ? "user.banned" : "user.unbanned",
        actorUserId: adminId,
        detail: { targetUserId: userId },
      },
    }),
  ]);
}

// ---------- Admin listings ----------

export async function adminStats() {
  const [pendingVerifications, openReports, suspended, raised, users] =
    await Promise.all([
      prisma.verificationRequest.count({ where: { status: "PENDING" } }),
      prisma.report.count({ where: { status: "OPEN" } }),
      prisma.event.count({ where: { status: "SUSPENDED" } }),
      prisma.fundraiser.aggregate({ _sum: { raisedAmount: true } }),
      prisma.user.count(),
    ]);
  return {
    pendingVerifications,
    openReports,
    suspended,
    totalRaised: raised._sum.raisedAmount ?? 0,
    users,
  };
}

export async function adminListCampaigns(limit = 100) {
  return prisma.event.findMany({
    orderBy: { dateAdded: "desc" },
    take: limit,
    include: {
      fundraiser: {
        select: { raisedAmount: true, targetAmount: true, currency: true },
      },
      user: { select: { name: true, email: true } },
      _count: { select: { reports: true } },
    },
  });
}

export async function adminListUsers(limit = 100) {
  return prisma.user.findMany({
    orderBy: { dateAdded: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isBanned: true,
      verificationStatus: true,
      _count: { select: { events: true } },
    },
  });
}
