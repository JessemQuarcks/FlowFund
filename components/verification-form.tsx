"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BadgeCheck, Clock, Loader2, ShieldX } from "lucide-react";
import { ID_TYPES } from "@/schemas/verification";

type State = {
  status: "UNVERIFIED" | "PENDING" | "VERIFIED" | "REJECTED";
  latest: { status: string; reviewNotes: string | null } | null;
};

export function VerificationForm({ state }: { state: State }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [idType, setIdType] = useState<string>(ID_TYPES[0]);
  const [idNumber, setIdNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (state.status === "VERIFIED") {
    return (
      <Notice
        icon={<BadgeCheck className="h-10 w-10 text-primary-600" />}
        title="You're verified"
        body="Your organiser badge is live and you can withdraw funds after a campaign ends."
      />
    );
  }

  if (state.status === "PENDING") {
    return (
      <Notice
        icon={<Clock className="h-10 w-10 text-amber-500" />}
        title="Verification under review"
        body="We've received your details. You'll be able to withdraw once an admin approves your account."
      />
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, phone, idType, idNumber }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Could not submit");
      toast.success("Verification submitted for review");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle>Verify your identity</CardTitle>
        <CardDescription>
          Verification protects donors and unlocks withdrawals. Your details are
          reviewed by our team and never shown publicly.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.status === "REJECTED" && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-300">
            <ShieldX className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Your last submission was rejected
              {state.latest?.reviewNotes
                ? `: ${state.latest.reviewNotes}`
                : "."}{" "}
              You can submit again below.
            </span>
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full legal name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="As shown on your ID"
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+233 …"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>ID type</Label>
              <Select value={idType} onValueChange={setIdType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ID_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="idNumber">ID number</Label>
            <Input
              id="idNumber"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="gradient"
            disabled={submitting}
            className="w-full"
          >
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit for verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function Notice({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <Card className="shadow-soft">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        {icon}
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">{body}</p>
      </CardContent>
    </Card>
  );
}
