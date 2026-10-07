import { env } from "@/lib/env";

// Email delivery through Resend's HTTP API. Kept provider-agnostic at the call
// site: callers use sendEmail and the template helpers, never Resend directly.
//
// When RESEND_API_KEY / EMAIL_FROM are not configured, emails are logged
// instead of sent, so local development and tests work without a provider.

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function emailConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.EMAIL_FROM);
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  if (!emailConfigured()) {
    console.info(
      `[email] (not sent — provider not configured) to=${message.to} subject=${message.subject}`,
    );
    return;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });
    if (!response.ok) {
      console.error(
        `[email] Resend returned HTTP ${response.status} for ${message.subject}`,
      );
    }
  } catch (error) {
    // Email is best-effort: never let a delivery failure break the request
    // that triggered it.
    console.error("[email] send failed:", error);
  }
}

// Minimal shared chrome so every email looks consistent.
export function layout(title: string, body: string): string {
  return `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <h1 style="color:#16a34a;font-size:20px">FlowFund</h1>
    <h2 style="font-size:18px">${title}</h2>
    ${body}
    <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
    <p style="color:#666;font-size:12px">You received this email from FlowFund.</p>
  </div></body></html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function passwordResetEmail(resetUrl: string): EmailMessage["html"] {
  return layout(
    "Reset your password",
    `<p>We received a request to reset your FlowFund password.</p>
     <p><a href="${resetUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset password</a></p>
     <p style="color:#666;font-size:13px">This link expires in one hour. If you didn't ask for this, you can ignore this email.</p>`,
  );
}

export function verifyEmailEmail(verifyUrl: string): EmailMessage["html"] {
  return layout(
    "Confirm your email",
    `<p>Welcome to FlowFund! Please confirm your email address.</p>
     <p><a href="${verifyUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Confirm email</a></p>`,
  );
}

export function contactEmail(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): EmailMessage["html"] {
  return layout(
    "New contact message",
    `<p><strong>From:</strong> ${escapeHtml(input.name)} (${escapeHtml(input.email)})</p>
     ${input.subject ? `<p><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>` : ""}
     <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>`,
  );
}
