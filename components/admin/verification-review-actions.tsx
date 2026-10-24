"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Identity = { idType: string; idNumber: string };
type Decision = "approve" | "reject";

function isIdentity(value: unknown): value is Identity {
  if (typeof value !== "object" || value === null) return false;
  return (
    "idType" in value &&
    typeof value.idType === "string" &&
    "idNumber" in value &&
    typeof value.idNumber === "string"
  );
}

export function VerificationReviewActions({
  requestId,
}: {
  requestId: string;
}) {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [identityLoading, setIdentityLoading] = useState(false);
  const [busyDecision, setBusyDecision] = useState<Decision | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [notes, setNotes] = useState("");

  const toggleIdentity = async () => {
    if (identity) {
      setIdentity(null);
      return;
    }

    setIdentityLoading(true);
    try {
      const response = await fetch(
        `/api/admin/verifications/${requestId}/identity`,
        { cache: "no-store" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Could not load identity number");
      }
      if (!isIdentity(payload)) {
        throw new Error("Identity response was invalid");
      }
      setIdentity(payload);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not load identity number",
      );
    } finally {
      setIdentityLoading(false);
    }
  };

  const submitDecision = async (decision: Decision) => {
    setBusyDecision(decision);
    try {
      const response = await fetch(`/api/admin/verifications/${requestId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          ...(decision === "reject" && notes.trim()
            ? { notes: notes.trim() }
            : {}),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.message ?? "Could not review verification");
      }
      setIdentity(null);
      setRejectOpen(false);
      setNotes("");
      toast.success(
        decision === "approve" ? "Organiser verified" : "Verification rejected",
      );
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Could not review verification",
      );
    } finally {
      setBusyDecision(null);
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={toggleIdentity}
          disabled={identityLoading || busyDecision !== null}
          aria-expanded={identity !== null}
        >
          {identityLoading ? (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          ) : identity ? (
            <EyeOff className="mr-1.5 h-4 w-4" />
          ) : (
            <Eye className="mr-1.5 h-4 w-4" />
          )}
          {identityLoading ? "Loading..." : identity ? "Hide ID" : "View ID"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="gradient"
          onClick={() => submitDecision("approve")}
          disabled={busyDecision !== null || identityLoading}
        >
          {busyDecision === "approve" && (
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
          )}
          Approve
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => setRejectOpen(true)}
          disabled={busyDecision !== null || identityLoading}
        >
          Reject
        </Button>
      </div>

      {identity && (
        <p
          className="mt-2 text-sm text-muted-foreground"
          aria-live="polite"
          aria-label="Revealed identity number"
        >
          {identity.idType}:{" "}
          <span className="font-medium">{identity.idNumber}</span>
        </p>
      )}

      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          if (busyDecision === null) setRejectOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject verification</DialogTitle>
            <DialogDescription>
              Add an optional note explaining what the applicant should correct
              before submitting again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label
              htmlFor={`verification-notes-${requestId}`}
              className="text-sm font-medium"
            >
              Reviewer note{" "}
              <span className="text-muted-foreground">(optional)</span>
            </label>
            <Textarea
              id={`verification-notes-${requestId}`}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={1000}
              placeholder="For example: the ID image was unreadable."
              disabled={busyDecision !== null}
            />
            <p className="text-xs text-muted-foreground">
              {notes.length}/1000 characters. This note is shown to the
              applicant.
            </p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={busyDecision !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => submitDecision("reject")}
              disabled={busyDecision !== null}
            >
              {busyDecision === "reject" && (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              )}
              Confirm rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
