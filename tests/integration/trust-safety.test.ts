import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  getVerificationState,
  reviewVerification,
  submitVerification,
} from "@/lib/services/verification";
import {
  adminStats,
  createReport,
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
});

describe("moderation", () => {
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
