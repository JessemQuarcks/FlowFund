import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma";
import { POST as reviewVerificationRoute } from "@/app/api/admin/verifications/[id]/route";
import { POST as resolveReportRoute } from "@/app/api/admin/reports/[id]/route";
import { submitVerification } from "@/lib/services/verification";
import { createReport } from "@/lib/services/moderation";
import {
  createEventWithFundraiser,
  createUser,
  resetDatabase,
} from "./helpers";

// requireAdmin reads the session via getServerSession, then checks the role in
// the database. Mocking the session lets us drive the real route handlers.
vi.mock("next-auth", () => ({ getServerSession: vi.fn() }));
const session = vi.mocked(getServerSession);

function signedInAs(id: string | null) {
  session.mockResolvedValue(
    id
      ? ({ user: { id } } as Awaited<ReturnType<typeof getServerSession>>)
      : null,
  );
}

function post(body: unknown) {
  return new Request("http://test.local/api/admin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

async function makeAdmin() {
  const user = await createUser();
  await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return user;
}

beforeEach(async () => {
  session.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("admin route authorization", () => {
  it("rejects an unauthenticated request with 401", async () => {
    signedInAs(null);
    const res = await reviewVerificationRoute(
      post({ decision: "approve" }),
      ctx("x"),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a non-admin with 403", async () => {
    const user = await createUser();
    signedInAs(user.id);
    const res = await reviewVerificationRoute(
      post({ decision: "approve" }),
      ctx("x"),
    );
    expect(res.status).toBe(403);
  });
});

describe("admin route validation and workflow", () => {
  it("returns 400 on an invalid body", async () => {
    const admin = await makeAdmin();
    signedInAs(admin.id);
    const res = await resolveReportRoute(post({ action: "nuke" }), ctx("x"));
    expect(res.status).toBe(400);
  });

  it("reviews a pending verification (200) then rejects the stale repeat (409)", async () => {
    const admin = await makeAdmin();
    const applicant = await createUser();
    const req = await submitVerification(applicant.id, {
      fullName: "Ama",
      phone: "+233240000000",
      idType: "Ghana Card",
      idNumber: "GHA-1",
    });
    signedInAs(admin.id);

    const ok = await reviewVerificationRoute(
      post({ decision: "approve" }),
      ctx(req.id),
    );
    expect(ok.status).toBe(200);

    const stale = await reviewVerificationRoute(
      post({ decision: "reject" }),
      ctx(req.id),
    );
    expect(stale.status).toBe(409);
  });
});
