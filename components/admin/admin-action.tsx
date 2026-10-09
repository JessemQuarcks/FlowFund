"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

type Variant = Parameters<typeof Button>[0]["variant"];

// One button that POSTs a JSON body to an admin endpoint, then refreshes the
// server-rendered console so the change shows immediately.
export function AdminAction({
  url,
  body,
  label,
  variant = "outline",
  confirmText,
  successText = "Done",
}: {
  url: string;
  body: unknown;
  label: string;
  variant?: Variant;
  confirmText?: string;
  successText?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const run = async () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setLoading(true);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await res.json().catch(() => null);
      if (!res.ok) throw new Error(payload?.message ?? "Action failed");
      toast.success(successText);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button size="sm" variant={variant} disabled={loading} onClick={run}>
      {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {label}
    </Button>
  );
}
