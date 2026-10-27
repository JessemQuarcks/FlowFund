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
