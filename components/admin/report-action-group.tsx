"use client";

import { useState } from "react";
import { AdminAction } from "@/components/admin/admin-action";

export function ReportActionGroup({ reportId }: { reportId: string }) {
  const [busyAction, setBusyAction] = useState<"dismiss" | "suspend" | null>(
    null,
  );

  return (
    <>
      <AdminAction
        url={`/api/admin/reports/${reportId}`}
        body={{ action: "suspend" }}
        label="Suspend campaign"
        variant="destructive"
        confirmText="Suspend this campaign?"
        confirmDescription="This resolves the report as actioned and suspends the campaign so supporters can no longer donate until an admin reinstates it."
        confirmLabel="Suspend campaign"
        pendingLabel="Suspending..."
        successText="Campaign suspended"
        disabled={busyAction !== null}
        onActionStart={() => setBusyAction("suspend")}
        onActionEnd={() => setBusyAction(null)}
      />
      <AdminAction
        url={`/api/admin/reports/${reportId}`}
        body={{ action: "dismiss" }}
        label="Dismiss report"
        confirmText="Dismiss this report?"
        confirmDescription="This closes the report without changing the campaign state. The campaign stays active unless a separate moderation action is taken."
        confirmLabel="Dismiss report"
        pendingLabel="Dismissing..."
        successText="Report dismissed"
        disabled={busyAction !== null}
        onActionStart={() => setBusyAction("dismiss")}
        onActionEnd={() => setBusyAction(null)}
      />
    </>
  );
}
