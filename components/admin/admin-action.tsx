"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Variant = Parameters<typeof Button>[0]["variant"];

export function AdminAction({
  url,
  body,
  label,
  variant = "outline",
  confirmText,
  confirmDescription,
  confirmLabel,
  pendingLabel,
  successText = "Done",
  disabled = false,
  onActionStart,
  onActionEnd,
}: {
  url: string;
  body: unknown;
  label: string;
  variant?: Variant;
  confirmText?: string;
  confirmDescription?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  successText?: string;
  disabled?: boolean;
  onActionStart?: () => void;
  onActionEnd?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const run = async () => {
    setLoading(true);
    onActionStart?.();
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
      onActionEnd?.();
    }
  };

  const button = (
    <Button
      type="button"
      size="sm"
      variant={variant}
      disabled={loading || disabled}
      onClick={() => {
        if (!confirmText) void run();
      }}
    >
      {loading && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
      {loading ? (pendingLabel ?? label) : label}
    </Button>
  );

  if (!confirmText) {
    return button;
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!loading) setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{confirmText}</AlertDialogTitle>
          {confirmDescription && (
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            type="button"
            disabled={loading}
            onClick={() => setOpen(false)}
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="button"
            disabled={loading}
            className={buttonVariants({ variant })}
            onClick={() => {
              setOpen(false);
              void run();
            }}
          >
            {loading
              ? pendingLabel ?? confirmLabel ?? "Processing..."
              : confirmLabel ?? "Continue"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
