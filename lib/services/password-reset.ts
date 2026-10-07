import { randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { passwordResetEmail, sendEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Starts a password reset. Always resolves without revealing whether the email
// belongs to an account, so the endpoint cannot be used to probe for users.
export async function requestPasswordReset(email: string, baseUrl: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  const resetUrl = `${baseUrl}/reset-password?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Reset your FlowFund password",
    html: passwordResetEmail(resetUrl),
    text: `Reset your password: ${resetUrl}`,
  });
}

// Completes a reset: validates the token, sets the new password and clears
// every outstanding token for that email.
export async function resetPassword(token: string, newPassword: string) {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || record.expires.getTime() < Date.now()) {
    throw errors.badRequest("This reset link is invalid or has expired");
  }

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });
  if (!user) {
    throw errors.badRequest("This reset link is invalid or has expired");
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: user.id }, data: { password: hashed } }),
    prisma.verificationToken.deleteMany({
      where: { identifier: record.identifier },
    }),
  ]);
}
