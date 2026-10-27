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
