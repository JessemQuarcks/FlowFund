import bcrypt from "bcryptjs";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  requestPasswordReset,
  resetPassword,
} from "@/lib/services/password-reset";
import { createUser, resetDatabase } from "./helpers";

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
  passwordResetEmail: vi.fn(() => "<html></html>"),
}));
const email = vi.mocked(sendEmail);

beforeEach(async () => {
  email.mockReset();
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("password reset", () => {
  it("emails a reset link and lets the user set a new password", async () => {
    const user = await createUser("reset-me@example.com");

    await requestPasswordReset("reset-me@example.com", "https://app.test");

    expect(email).toHaveBeenCalledTimes(1);
    const sent = email.mock.calls[0][0];
    expect(sent.to).toBe("reset-me@example.com");
    const token = /token=([a-f0-9]+)/.exec(sent.text ?? "")?.[1];
    expect(token).toBeTruthy();

    await resetPassword(token!, "brandnew1!");

    const saved = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      omit: { password: false },
    });
    expect(await bcrypt.compare("brandnew1!", saved.password!)).toBe(true);
    // The token is single-use: consumed on reset.
    expect(await prisma.verificationToken.count()).toBe(0);
  });

  it("does not reveal whether an email exists and sends nothing", async () => {
    await requestPasswordReset("nobody@example.com", "https://app.test");
    expect(email).not.toHaveBeenCalled();
    expect(await prisma.verificationToken.count()).toBe(0);
  });

  it("rejects an expired token", async () => {
    await createUser("exp@example.com");
    await prisma.verificationToken.create({
      data: {
        identifier: "exp@example.com",
        token: "expired-token",
        expires: new Date(Date.now() - 1000),
      },
    });

    await expect(
      resetPassword("expired-token", "brandnew1!"),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects an unknown token", async () => {
    await expect(resetPassword("nope", "brandnew1!")).rejects.toMatchObject({
      status: 400,
    });
  });
});
