import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  sendVerificationEmail,
  verifyEmailToken,
} from "@/lib/services/email-verification";
import { createUser, resetDatabase } from "./helpers";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  verifyEmailEmail: vi.fn(() => "<html></html>"),
}));
const email = vi.mocked(sendEmail);

beforeEach(async () => {
  email.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("email verification", () => {
  it("emails a link and marks the address verified", async () => {
    const user = await createUser("verify@example.com");
    expect(user.emailVerified).toBeNull();

    await sendVerificationEmail("verify@example.com", "https://app.test");
    const token = /token=([a-f0-9]+)/.exec(
      email.mock.calls[0][0].text ?? "",
    )?.[1];
    expect(token).toBeTruthy();

    const ok = await verifyEmailToken(token!);
    expect(ok).toBe(true);

    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
    expect(saved.emailVerified).not.toBeNull();
    expect(await prisma.verificationToken.count()).toBe(0);
  });

  it("rejects an unknown or expired token", async () => {
    expect(await verifyEmailToken("nope")).toBe(false);

    await prisma.verificationToken.create({
      data: {
        identifier: "x@example.com",
        token: "old",
        expires: new Date(Date.now() - 1000),
      },
    });
    expect(await verifyEmailToken("old")).toBe(false);
  });
});
