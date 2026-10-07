import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/services/email-verification";

// Clicked from the confirmation email. Verifies the address and sends the user
// to sign in with a flag the page can show a message for.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const ok = token ? await verifyEmailToken(token) : false;
  return NextResponse.redirect(
    new URL(`/signin?verified=${ok ? "1" : "0"}`, url.origin),
  );
}
