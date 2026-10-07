"use client";

import { useState, useEffect, use } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { EventWithFundraiser } from "@/types";
import { formatMoney, toMajorUnits } from "@/lib/money";

type PayoutAccount = {
  id: string;
  accountType: "BANK_ACCOUNT" | "MOBILE_MONEY";
  bankName: string | null;
  accountNumber: string;
  accountName: string;
};

export default function WithdrawFundsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<EventWithFundraiser | null>(null);
  const [accounts, setAccounts] = useState<PayoutAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New-account form.
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newType, setNewType] = useState<"bank" | "mobile">("bank");
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [addingAccount, setAddingAccount] = useState(false);

  async function loadAccounts() {
    const res = await fetch("/api/payout-accounts");
    if (res.ok) {
      const body = await res.json();
      setAccounts(body.accounts ?? []);
      if (body.accounts?.[0] && !selectedAccount) {
        setSelectedAccount(body.accounts[0].id);
      }
    }
  }

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${id}`);
        if (!response.ok) throw new Error("Failed to fetch event");
        const { data }: { data: EventWithFundraiser } = await response.json();
        setEvent(data);
        await loadAccounts();
      } catch (err) {
        console.error("Error loading withdrawal page:", err);
        setError("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    }
    if (id) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fundraiser = event?.fundraiser;
  const currency = fundraiser?.currency ?? "GHS";
  const availablePesewas = fundraiser
    ? fundraiser.raisedAmount - fundraiser.totalWithdrawn
    : 0;

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAccount(true);
    setError(null);
    try {
      const res = await fetch("/api/payout-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountType: newType === "bank" ? "BANK_ACCOUNT" : "MOBILE_MONEY",
          bankCode,
          accountNumber,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(body?.message ?? "Could not add the account");
      setShowAddAccount(false);
      setBankCode("");
      setAccountNumber("");
      await loadAccounts();
      setSelectedAccount(body.account.id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not add the account",
      );
    } finally {
      setAddingAccount(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const amount = Number.parseFloat(withdrawalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid withdrawal amount");
      setIsSubmitting(false);
      return;
    }
    if (!selectedAccount) {
      setError("Choose a payout account");
      setIsSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundraiserId: fundraiser?.id,
          payoutAccountId: selectedAccount,
          amount,
          notes: notes || undefined,
        }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.message ?? "Withdrawal failed");

      setSuccess("Withdrawal requested. It is now processing.");
      setWithdrawalAmount("");
      setNotes("");
      // Reflect the reservation locally.
      setEvent((prev) =>
        prev && prev.fundraiser
          ? {
              ...prev,
              fundraiser: {
                ...prev.fundraiser,
                totalWithdrawn:
                  prev.fundraiser.totalWithdrawn + Math.round(amount * 100),
              },
            }
          : prev,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Withdrawal failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event || !fundraiser) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Event not found or you don&apos;t have permission to withdraw funds
            from this event.
            <Link href="/dashboard" className="block mt-2 underline">
              Return to dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Dashboard</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>
            Withdraw available funds from your fundraiser
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Raised</div>
              <div className="text-2xl font-bold">
                {formatMoney(fundraiser.raisedAmount, currency)}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">
                Previously Withdrawn
              </div>
              <div className="text-2xl font-bold">
                {formatMoney(fundraiser.totalWithdrawn, currency)}
              </div>
            </div>
            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="text-sm text-muted-foreground">Available</div>
              <div className="text-2xl font-bold">
                {formatMoney(availablePesewas, currency)}
              </div>
            </div>
          </div>

          {success && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Requested</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {availablePesewas <= 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No funds available</AlertTitle>
              <AlertDescription>
                There are currently no funds available for withdrawal.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label>Payout account</Label>
                {accounts.length > 0 ? (
                  <Select
                    value={selectedAccount}
                    onValueChange={setSelectedAccount}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.accountName} · {a.accountNumber}
                          {a.bankName ? ` (${a.bankName})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    You have no payout accounts yet.
                  </p>
                )}
                <Button
                  type="button"
                  variant="link"
                  className="px-0"
                  onClick={() => setShowAddAccount((v) => !v)}
                >
                  {showAddAccount ? "Cancel" : "Add a payout account"}
                </Button>
              </div>

              {showAddAccount && (
                <div className="space-y-4 rounded-md border p-4">
                  <RadioGroup
                    value={newType}
                    onValueChange={(v) => setNewType(v as "bank" | "mobile")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="bank" id="new-bank" />
                      <Label htmlFor="new-bank">Bank account</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="mobile" id="new-mobile" />
                      <Label htmlFor="new-mobile">Mobile money</Label>
                    </div>
                  </RadioGroup>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="bankCode">
                        {newType === "bank" ? "Bank code" : "Provider code"}
                      </Label>
                      <Input
                        id="bankCode"
                        value={bankCode}
                        onChange={(e) => setBankCode(e.target.value)}
                        placeholder={
                          newType === "bank" ? "e.g. 058" : "e.g. MTN"
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">
                        {newType === "bank"
                          ? "Account number"
                          : "Wallet number"}
                      </Label>
                      <Input
                        id="accountNumber"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddAccount}
                    disabled={addingAccount || !bankCode || !accountNumber}
                  >
                    {addingAccount ? "Verifying..." : "Verify & save account"}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    We confirm the account with Paystack and save the verified
                    name.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal amount ({currency})</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={withdrawalAmount}
                    max={String(toMajorUnits(availablePesewas))}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    placeholder="Enter amount to withdraw"
                    required
                    className="pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7"
                    onClick={() =>
                      setWithdrawalAmount(
                        String(toMajorUnits(availablePesewas)),
                      )
                    }
                  >
                    Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can withdraw up to{" "}
                  {formatMoney(availablePesewas, currency)}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about this withdrawal"
                  className="min-h-20"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    availablePesewas <= 0 ||
                    accounts.length === 0
                  }
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                      Processing...
                    </>
                  ) : (
                    "Withdraw Funds"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
