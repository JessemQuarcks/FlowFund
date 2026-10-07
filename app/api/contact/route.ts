import { NextResponse } from "next/server";
import { readJson, withErrorHandling } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { contactSchema } from "@/schemas/contact";
import { contactEmail, sendEmail } from "@/lib/email";
import { env } from "@/lib/env";

export const POST = withErrorHandling(async (request: Request) => {
  enforceRateLimit(
    `contact:ip:${getClientIp(request.headers)}`,
    5,
    60 * 60 * 1000,
  );
  const input = contactSchema.parse(await readJson(request));

  const to = env.CONTACT_TO ?? env.EMAIL_FROM;
  if (to) {
    await sendEmail({
      to,
      subject: `Contact form: ${input.subject ?? "New message"}`,
      html: contactEmail(input),
      text: `${input.name} <${input.email}>\n\n${input.message}`,
    });
  } else {
    // No recipient configured: record it so the message is not silently lost.
    console.info(`[contact] from ${input.email}: ${input.message}`);
  }

  return NextResponse.json({ success: true });
});
