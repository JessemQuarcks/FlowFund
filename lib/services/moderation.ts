import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { errors } from "@/lib/errors";
import type { CreateReportInput } from "@/schemas/moderation";
import type {
  CampaignStatusFilter,
  ReportStatusFilter,
  VerificationStatusFilter,
} from "@/schemas/admin";
import { ADMIN_QUEUE_PAGE_SIZE } from "@/schemas/admin";

type AdminPage<T> = {
  items: T[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
};

async function listAdminPage<T>(
  requestedPage: number,
  count: () => Promise<number>,
  find: (page: number) => Promise<T[]>,
): Promise<AdminPage<T>> {
  const total = await count();
  const totalPages = Math.max(1, Math.ceil(total / ADMIN_QUEUE_PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const items = await find(page);
  return {
    items,
    total,
    page,
    totalPages,
    perPage: ADMIN_QUEUE_PAGE_SIZE,
  };
}

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

export async function listReports(params: {
  q?: string;
  page: number;
  status: ReportStatusFilter;
}) {
  const where: Prisma.ReportWhereInput = {};
  if (params.status !== "all") where.status = params.status;
  if (params.q) {
    where.OR = [
      { reason: { contains: params.q } },
      { details: { contains: params.q } },
      { reporterEmail: { contains: params.q } },
      { event: { title: { contains: params.q } } },
    ];
  }

  return listAdminPage(
    params.page,
    () => prisma.report.count({ where }),
    (page) =>
      prisma.report.findMany({
        where,
        orderBy: [{ dateAdded: "desc" }, { id: "asc" }],
        skip: (page - 1) * ADMIN_QUEUE_PAGE_SIZE,
        take: ADMIN_QUEUE_PAGE_SIZE,
        include: {
          event: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              status: true,
              date: true,
              dateAdded: true,
              dateUpdated: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  isBanned: true,
                  isVerifiedOrganiser: true,
                  verificationStatus: true,
                  dateAdded: true,
                  _count: { select: { events: true } },
                },
              },
              fundraiser: {
                select: {
                  raisedAmount: true,
                  targetAmount: true,
                  donorCount: true,
                  totalWithdrawn: true,
                  currency: true,
                  endDate: true,
                },
              },
              reports: {
                orderBy: [{ dateAdded: "desc" }, { id: "asc" }],
                take: 5,
                select: {
                  id: true,
                  reason: true,
                  details: true,
                  status: true,
                  dateAdded: true,
                },
              },
              _count: { select: { reports: true, updates: true } },
            },
          },
        },
      }),
  );
}

// Admin dismisses a report or suspends the reported campaign.
export async function resolveReport(
  adminId: string,
  reportId: string,
  action: "dismiss" | "suspend",
) {
  const report = await prisma.report.findUnique({
    where: { id: reportId },
    select: {
      id: true,
      status: true,
      eventId: true,
      event: { select: { status: true } },
    },
  });
  if (!report) throw errors.notFound("Report not found");

  // State-aware: only an open report can be resolved. Repeated or stale
  // resolutions are rejected instead of re-applying.
  if (report.status !== "OPEN") {
    throw errors.conflict("This report has already been resolved");
  }

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
          detail: {
            eventId: report.eventId,
            reportId,
            via: "report",
            from: report.event.status,
            to: "SUSPENDED",
          },
        },
      }),
      prisma.auditLog.create({
        data: {
          action: "report.actioned",
          actorUserId: adminId,
          detail: {
            eventId: report.eventId,
            reportId,
            from: "OPEN",
            to: "ACTIONED",
          },
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.report.update({
        where: { id: reportId },
        data: { status: "DISMISSED" },
      }),
      prisma.auditLog.create({
        data: {
          action: "report.dismissed",
          actorUserId: adminId,
          detail: {
            eventId: report.eventId,
            reportId,
            from: "OPEN",
            to: "DISMISSED",
          },
        },
      }),
    ]);
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
    select: { id: true, status: true },
  });
  if (!event) throw errors.notFound("Campaign not found");

  // State-aware transitions: a campaign can only be suspended if it isn't
  // already, and reinstated only from a suspended state.
  if (event.status === status) {
    throw errors.conflict(`Campaign is already ${status.toLowerCase()}`);
  }
  if (status === "ACTIVE" && event.status !== "SUSPENDED") {
    throw errors.conflict("Only a suspended campaign can be reinstated");
  }

  await prisma.$transaction([
    prisma.event.update({ where: { id: eventId }, data: { status } }),
    prisma.auditLog.create({
      data: {
        action:
          status === "SUSPENDED" ? "campaign.suspended" : "campaign.reinstated",
        actorUserId: adminId,
        detail: { eventId, from: event.status, to: status },
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
    select: { role: true, isBanned: true },
  });
  if (!user) throw errors.notFound("User not found");
  if (user.role === "ADMIN") {
    throw errors.badRequest("Admins cannot be banned");
  }
  // State-aware: reject a no-op ban/unban so a stale request can't double-apply.
  if (user.isBanned === banned) {
    throw errors.conflict(
      banned ? "User is already banned" : "User is not banned",
    );
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

export async function adminListCampaigns(params: {
  q?: string;
  page: number;
  status: CampaignStatusFilter;
}) {
  const where: Prisma.EventWhereInput = {};
  if (params.status !== "all") where.status = params.status;
  if (params.q) {
    where.OR = [
      { title: { contains: params.q } },
      { description: { contains: params.q } },
      { user: { name: { contains: params.q } } },
      { user: { email: { contains: params.q } } },
    ];
  }

  return listAdminPage(
    params.page,
    () => prisma.event.count({ where }),
    (page) =>
      prisma.event.findMany({
        where,
        orderBy: [{ dateAdded: "desc" }, { id: "asc" }],
        skip: (page - 1) * ADMIN_QUEUE_PAGE_SIZE,
        take: ADMIN_QUEUE_PAGE_SIZE,
        include: {
          fundraiser: {
            select: { raisedAmount: true, targetAmount: true, currency: true },
          },
          user: { select: { name: true, email: true } },
          _count: { select: { reports: true } },
        },
      }),
  );
}

export async function adminListUsers(params: {
  q?: string;
  page: number;
  verificationStatus: VerificationStatusFilter;
  banned: "all" | "banned" | "active";
}) {
  const where: Prisma.UserWhereInput = {};
  if (params.verificationStatus !== "all") {
    where.verificationStatus = params.verificationStatus;
  }
  if (params.banned !== "all") where.isBanned = params.banned === "banned";
  if (params.q) {
    where.OR = [
      { name: { contains: params.q } },
      { email: { contains: params.q } },
    ];
  }

  return listAdminPage(
    params.page,
    () => prisma.user.count({ where }),
    (page) =>
      prisma.user.findMany({
        where,
        orderBy: [{ dateAdded: "desc" }, { id: "asc" }],
        skip: (page - 1) * ADMIN_QUEUE_PAGE_SIZE,
        take: ADMIN_QUEUE_PAGE_SIZE,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBanned: true,
          verificationStatus: true,
          _count: { select: { events: true } },
        },
      }),
  );
}
