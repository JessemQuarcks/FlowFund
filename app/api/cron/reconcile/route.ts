import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/api";
import { env } from "@/lib/env";
import { errors } from "@/lib/errors";
import { reconcile } from "@/lib/services/reconciliation";

// Triggers a reconciliation run. Scheduler-agnostic: any cron (Vercel Cron, a
// VPS crontab, an external pinger) calls it with the shared secret as a Bearer
// token. Disabled until CRON_SECRET is configured.
//
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" .../api/cron/reconcile
export const POST = withErrorHandling(async (request: Request) => {
  if (!env.CRON_SECRET) {
    throw errors.notFound("Reconciliation trigger is not configured");
  }
  const provided = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");
  if (provided !== env.CRON_SECRET) {
    throw errors.unauthorized();
  }

  const report = await reconcile();
  return NextResponse.json({ success: true, report });
});
