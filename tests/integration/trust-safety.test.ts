import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  listAdminVerifications,
  getVerificationState,
  reviewVerification,
  submitVerification,
  viewVerificationIdentity,
} from "@/lib/services/verification";
import {
  adminListCampaigns,
  adminListUsers,
  adminStats,
  createReport,
  listReports,
  resolveReport,
  setEventStatus,
  setUserBanned,
} from "@/lib/services/moderation";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

async function admin() {
  const user = await createUser();
  await prisma.user.update({
    where: { id: user.id },
    data: { role: "ADMIN" },
  });
  return user;
}

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("organiser verification", () => {
  const kyc = {
    fullName: "Ama Serwaa",
    phone: "+233240000000",
    idType: "Ghana Card" as const,
    idNumber: "GHA-123",
  };

  it("moves UNVERIFIED → PENDING → VERIFIED and flips the badge", async () => {
    const user = await createUser();
    const reviewer = await admin();

    const req = await submitVerification(user.id, kyc);
    expect((await getVerificationState(user.id)).status).toBe("PENDING");

    await reviewVerification(reviewer.id, req.id, { decision: "approve" });

    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(saved.verificationStatus).toBe("VERIFIED");
    expect(saved.isVerifiedOrganiser).toBe(true);
    // The action is recorded in the audit log.
    expect(
      await prisma.auditLog.count({
        where: { action: "verification.approved" },
      }),
    ).toBe(1);
  });

  it("rejects with a reason and does not verify", async () => {
    const user = await createUser();
    const reviewer = await admin();
    const req = await submitVerification(user.id, kyc);

    await reviewVerification(reviewer.id, req.id, {
      decision: "reject",
      notes: "ID unreadable",
    });

    const state = await getVerificationState(user.id);
    expect(state.status).toBe("REJECTED");
    expect(state.latest?.reviewNotes).toBe("ID unreadable");
    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(saved.isVerifiedOrganiser).toBe(false);
  });

  it("reveals identity data on demand and audits access without storing the ID", async () => {
    const user = await createUser();
    const reviewer = await admin();
    const request = await submitVerification(user.id, {
      fullName: "Ama Serwaa",
      phone: "+233240000000",
      idType: "Ghana Card",
      idNumber: "GHA-SECRET-123",
    });

    const queue = await listAdminVerifications({
      page: 1,
      status: "PENDING",
    });
    expect(queue.items[0]).not.toHaveProperty("idNumber");

    await expect(
      viewVerificationIdentity(reviewer.id, request.id),
    ).resolves.toEqual({
      idType: "Ghana Card",
      idNumber: "GHA-SECRET-123",
      idNumberLast4: "T123",
    });

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "verification.identity_viewed" },
    });
    expect(JSON.stringify(audit.detail)).not.toContain("GHA-SECRET-123");
    expect(audit.detail).toMatchObject({
      verificationRequestId: request.id,
      targetUserId: user.id,
    });
  });

  it("refuses to submit when already verified", async () => {
    const user = await createUser();
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationStatus: "VERIFIED", isVerifiedOrganiser: true },
    });
    await expect(submitVerification(user.id, kyc)).rejects.toMatchObject({
      status: 409,
    });
  });

  it("purges the full ID after a decision but keeps the last four", async () => {
    const user = await createUser();
    const reviewer = await admin();
    const req = await submitVerification(user.id, {
      ...kyc,
      idNumber: "GHA-9876",
    });

    await reviewVerification(reviewer.id, req.id, { decision: "approve" });

    const saved = await prisma.verificationRequest.findUniqueOrThrow({
      where: { id: req.id },
    });
    expect(saved.idNumber).toBeNull();
    expect(saved.idNumberLast4).toBe("9876");
    // After redaction, a reveal returns only the masked value.
    const identity = await viewVerificationIdentity(reviewer.id, req.id);
    expect(identity.idNumber).toBeNull();
    expect(identity.idNumberLast4).toBe("9876");
  });

  it("rejects a stale or repeated verification review with a conflict", async () => {
    const user = await createUser();
    const reviewer = await admin();
    const req = await submitVerification(user.id, kyc);

    await reviewVerification(reviewer.id, req.id, { decision: "approve" });
    await expect(
      reviewVerification(reviewer.id, req.id, { decision: "reject" }),
    ).rejects.toMatchObject({ status: 409 });

    // The first decision stands.
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .verificationStatus,
    ).toBe("VERIFIED");
  });

  it("records the previous and new state on review, without the ID", async () => {
    const user = await createUser();
    const reviewer = await admin();
    const req = await submitVerification(user.id, {
      ...kyc,
      idNumber: "GHA-AUDIT-55",
    });
    await reviewVerification(reviewer.id, req.id, { decision: "approve" });

    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "verification.approved" },
    });
    expect(audit.detail).toMatchObject({ from: "PENDING", to: "VERIFIED" });
    expect(JSON.stringify(audit.detail)).not.toContain("GHA-AUDIT-55");
  });
});

describe("moderation", () => {
  it("searches and filters each admin queue and paginates large results", async () => {
    const owner = await createUser("admin-queue-search@example.com");
    const event = await createEventWithFundraiser(owner.id);
    await prisma.event.update({
      where: { id: event.id },
      data: { title: "Admin Queue Search Campaign" },
    });
    await createReport(event.id, { reason: "Admin Queue Search Report" });
    await submitVerification(owner.id, {
      fullName: "Admin Queue Search Person",
      phone: "+233240000000",
      idType: "Passport",
      idNumber: "P-1",
    });

    const verificationResults = await listAdminVerifications({
      q: "Admin Queue Search Person",
      page: 1,
      status: "PENDING",
    });
    expect(verificationResults.total).toBe(1);
    expect(verificationResults.items).toHaveLength(1);

    const reportResults = await listReports({
      q: "Admin Queue Search Report",
      page: 1,
      status: "OPEN",
    });
    expect(reportResults.total).toBe(1);
    expect(reportResults.items).toHaveLength(1);
    expect(reportResults.items[0].event.description).toBe("Clearing the beach");
    expect(reportResults.items[0].event.user.email).toBe(
      "admin-queue-search@example.com",
    );
    expect(reportResults.items[0].event._count.reports).toBe(1);
    expect(reportResults.items[0].event.fundraiser?.targetAmount).toBe(10_000);

    const campaignResults = await adminListCampaigns({
      q: "Admin Queue Search Campaign",
      page: 1,
      status: "ACTIVE",
    });
    expect(campaignResults.total).toBe(1);
    expect(campaignResults.items).toHaveLength(1);

    const userResults = await adminListUsers({
      q: "admin-queue-search@example.com",
      page: 1,
      verificationStatus: "PENDING",
      banned: "active",
    });
    expect(userResults.total).toBe(1);
    expect(userResults.items).toHaveLength(1);

    await Promise.all(
      Array.from({ length: 21 }, (_, index) =>
        createUser(`admin-queue-page-${index}@example.com`),
      ),
    );
    const pageResults = await adminListUsers({
      q: "admin-queue-page-",
      page: 2,
      verificationStatus: "all",
      banned: "all",
    });
    expect(pageResults.total).toBe(21);
    expect(pageResults.page).toBe(2);
    expect(pageResults.totalPages).toBe(2);
    expect(pageResults.items).toHaveLength(1);
  });

  it("files a report and lets an admin suspend the campaign", async () => {
    const owner = await createUser();
    const reviewer = await admin();
    const event = await createEventWithFundraiser(owner.id);

    await createReport(event.id, { reason: "Scam", details: "looks fake" });
    const report = await prisma.report.findFirstOrThrow();

    await resolveReport(reviewer.id, report.id, "suspend");

    const saved = await prisma.event.findUniqueOrThrow({
      where: { id: event.id },
    });
    expect(saved.status).toBe("SUSPENDED");
    expect(
      (await prisma.report.findUniqueOrThrow({ where: { id: report.id } }))
        .status,
    ).toBe("ACTIONED");
  });

  it("dismisses a report without touching the campaign", async () => {
    const owner = await createUser();
    const reviewer = await admin();
    const event = await createEventWithFundraiser(owner.id);
    await createReport(event.id, { reason: "Spam" });
    const report = await prisma.report.findFirstOrThrow();

    await resolveReport(reviewer.id, report.id, "dismiss");

    expect(
      (await prisma.event.findUniqueOrThrow({ where: { id: event.id } }))
        .status,
    ).toBe("ACTIVE");
    expect(
      (await prisma.report.findUniqueOrThrow({ where: { id: report.id } }))
        .status,
    ).toBe("DISMISSED");
  });

  it("suspends and reinstates a campaign", async () => {
    const owner = await createUser();
    const reviewer = await admin();
    const event = await createEventWithFundraiser(owner.id);

    await setEventStatus(reviewer.id, event.id, "SUSPENDED");
    expect(
      (await prisma.event.findUniqueOrThrow({ where: { id: event.id } }))
        .status,
    ).toBe("SUSPENDED");

    await setEventStatus(reviewer.id, event.id, "ACTIVE");
    expect(
      (await prisma.event.findUniqueOrThrow({ where: { id: event.id } }))
        .status,
    ).toBe("ACTIVE");
  });

  it("bans and unbans a user but never an admin", async () => {
    const reviewer = await admin();
    const user = await createUser();

    await setUserBanned(reviewer.id, user.id, true);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .isBanned,
    ).toBe(true);

    await setUserBanned(reviewer.id, user.id, false);
    expect(
      (await prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
        .isBanned,
    ).toBe(false);

    const otherAdmin = await admin();
    await expect(
      setUserBanned(reviewer.id, otherAdmin.id, true),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects resolving an already-resolved report with a conflict", async () => {
    const owner = await createUser();
    const reviewer = await admin();
    const event = await createEventWithFundraiser(owner.id);
    await createReport(event.id, { reason: "Spam" });
    const report = await prisma.report.findFirstOrThrow();

    await resolveReport(reviewer.id, report.id, "dismiss");
    await expect(
      resolveReport(reviewer.id, report.id, "suspend"),
    ).rejects.toMatchObject({ status: 409 });

    // The campaign was not suspended by the stale second call.
    expect(
      (await prisma.event.findUniqueOrThrow({ where: { id: event.id } }))
        .status,
    ).toBe("ACTIVE");
    // Dismissal is audited with the state change.
    const audit = await prisma.auditLog.findFirstOrThrow({
      where: { action: "report.dismissed" },
    });
    expect(audit.detail).toMatchObject({ from: "OPEN", to: "DISMISSED" });
  });

  it("rejects no-op and invalid campaign status transitions", async () => {
    const reviewer = await admin();
    const owner = await createUser();
    const event = await createEventWithFundraiser(owner.id);

    // Reinstating an active campaign is invalid.
    await expect(
      setEventStatus(reviewer.id, event.id, "ACTIVE"),
    ).rejects.toMatchObject({ status: 409 });

    await setEventStatus(reviewer.id, event.id, "SUSPENDED");
    // Suspending an already-suspended campaign is a no-op conflict.
    await expect(
      setEventStatus(reviewer.id, event.id, "SUSPENDED"),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("rejects a no-op ban/unban with a conflict", async () => {
    const reviewer = await admin();
    const user = await createUser();

    await expect(
      setUserBanned(reviewer.id, user.id, false),
    ).rejects.toMatchObject({ status: 409 });

    await setUserBanned(reviewer.id, user.id, true);
    await expect(
      setUserBanned(reviewer.id, user.id, true),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("counts work for the admin dashboard", async () => {
    const owner = await createUser();
    const event = await createEventWithFundraiser(owner.id);
    await createReport(event.id, { reason: "x" });
    await submitVerification(owner.id, {
      fullName: "A",
      phone: "+233240000000",
      idType: "Passport",
      idNumber: "P1",
    });

    const stats = await adminStats();
    expect(stats.openReports).toBe(1);
    expect(stats.pendingVerifications).toBe(1);
  });
});
