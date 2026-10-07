import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { errors } from "@/lib/errors";
import { sendEmail, verifyEmailEmail } from "@/lib/email";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Emails the user a link to confirm their address. Best-effort: a delivery
// problem must not fail the sign-up that triggered it.
export async function sendVerificationEmail(email: string, baseUrl: string) {
  const token = randomBytes(32).toString("hex");
  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;
  await sendEmail({
    to: email,
    subject: "Confirm your FlowFund email",
    html: verifyEmailEmail(verifyUrl),
    text: `Confirm your email: ${verifyUrl}`,
  });
}

// Marks the address verified. Returns whether the token was valid, so the
// route can redirect accordingly.
export async function verifyEmailToken(token: string): Promise<boolean> {
  const record = await prisma.verificationToken.findUnique({
    where: { token },
  });
  if (!record || record.expires.getTime() < Date.now()) return false;

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);
  return true;
}

// Resends verification for a signed-in, not-yet-verified user.
export async function resendVerification(userId: string, baseUrl: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw errors.notFound("User not found");
  if (user.emailVerified) return;
  await sendVerificationEmail(user.email, baseUrl);
}
