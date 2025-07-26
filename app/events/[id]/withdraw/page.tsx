"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { EventWithFundraiser } from "@/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WithdrawFundsPage() {
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [event, setEvent] = useState<EventWithFundraiser | null>(null);
  const [withdrawalMethod, setWithdrawalMethod] = useState<
    "bank" | "mobile_money"
  >("bank");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState({
    // Bank details
    bankCode: "",
    accountNumber: "",
    accountHolderName: "",

    // Mobile money details
    mobileNetwork: "",
    mobileNumber: "",
  });

  const banks = [
    {
      name: "Absa Bank Ghana Ltd",
      code: "030100",
    },
    {
      name: "Access Bank",
      code: "280100",
    },
    {
      name: "ADB Bank Limited",
      code: "080100",
    },
    {
      name: "Affinity Ghana Savings and Loans",
      code: "300341",
    },
    {
      name: "ARB Apex Bank",
      code: "070101",
    },
    {
      name: "Bank of Africa Ghana",
      code: "210100",
    },
    {
      name: "Best Point Savings & Loans",
      code: "300335",
    },
    {
      name: "CAL Bank Limited",
      code: "140100",
    },
    {
      name: "Consolidated Bank Ghana Limited",
      code: "340100",
    },
    {
      name: "Ecobank Ghana Limited",
      code: "130100",
    },
    {
      name: "FBNBank Ghana Limited",
      code: "200100",
    },
    {
      name: "Fidelity Bank Ghana Limited",
      code: "240100",
    },
    {
      name: "First Atlantic Bank Limited",
      code: "170100",
    },
    {
      name: "First National Bank Ghana Limited",
      code: "330100",
    },
    {
      name: "GCB Bank Limited",
      code: "040100",
    },
    {
      name: "Guaranty Trust Bank (Ghana) Limited",
      code: "230100",
    },
    {
      name: "National Investment Bank Limited",
      code: "050100",
    },
    {
      name: "OmniBSCI Bank",
      code: "360100",
    },
    {
      name: "Prudential Bank Limited",
      code: "180100",
    },
    {
      name: "Republic Bank (GH) Limited",
      code: "110100",
    },
    {
      name: "Services Integrity Savings and Loans",
      code: "300361",
    },
    {
      name: "Société Générale Ghana Limited",
      code: "090100",
    },
    {
      name: "Stanbic Bank Ghana Limited",
      code: "190100",
    },
    {
      name: "Standard Chartered Bank Ghana Limited",
      code: "020100",
    },
    {
      name: "United Bank for Africa Ghana Limited",
      code: "060100",
    },
    {
      name: "Universal Merchant Bank Ghana Limited",
      code: "100100",
    },
    {
      name: "Zenith Bank Ghana",
      code: "120100",
    },
  ];

  const mobileNetworks = [
    { name: "AT Money", code: "ATL" },
    { name: "MTN Mobile Money", code: "MTN" },
    { name: "Vodafone Cash", code: "VOD" },
  ];

  const handlePaymentDetailsChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setPaymentDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAccountSelectionChange = (
    type: "bankCode" | "mobileNetwork",
    value: string
  ) => {
    setPaymentDetails((prev) => ({
      ...prev,
      [type]: value,
    }));
  };

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${params.id}`);

        if (!response.ok) {
          throw new Error("Failed to fetch event");
        }

        const eventData = await response.json();
        setEvent(eventData.data);
      } catch (error) {
        console.error("Error fetching event:", error);
        setError("Failed to load event details");
      } finally {
        setIsLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!event) return;

    const amount = Number.parseFloat(withdrawalAmount);
    const availableAmount =
      Number(event.fundraiser?.raisedAmount) -
      (event?.fundraiser?.totalWithdrawn ?? 0);

    // Validate withdrawal amount
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid withdrawal amount");
      setIsSubmitting(false);
      return;
    }

    if (amount > availableAmount) {
      setError(
        `You can only withdraw up to $${availableAmount.toLocaleString()}`
      );
      setIsSubmitting(false);
      return;
    }

    if (
      !paymentDetails.accountHolderName ||
      (withdrawalMethod === "bank" &&
        (!paymentDetails.bankCode || !paymentDetails.accountNumber)) ||
      (withdrawalMethod === "mobile_money" && !paymentDetails.mobileNumber)
    ) {
      setError("Please fill all required fields");
      setIsSubmitting(false);
      return;
    }

    try {
      const withdrawalData = {
        eventId: params.id,
        amount,
        accountType:
          withdrawalMethod === "bank" ? "BANK_ACCOUNT" : "MOBILE_MONEY",
        accountNumber:
          withdrawalMethod === "bank"
            ? paymentDetails.accountNumber
            : paymentDetails.mobileNumber,
        bankCode:
          withdrawalMethod === "bank"
            ? paymentDetails.bankCode
            : paymentDetails.mobileNetwork,
        accountHolderName: paymentDetails.accountHolderName,
        notes,
      };

      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(withdrawalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to submit withdrawal request"
        );
      }

      const result = await response.json();
      setEvent(result.data);

      alert("Withdrawal request submitted successfully!");
      setWithdrawalAmount("");
      setPaymentDetails({
        bankCode: "",
        accountNumber: "",
        accountHolderName: "",
        mobileNetwork: "",
        mobileNumber: "",
      });
      setNotes("");
    } catch (error) {
      console.error("Withdrawal error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to submit withdrawal request"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMaxAmount = () => {
    if (event) {
      const availableAmount =
        Number(event.fundraiser?.raisedAmount) -
        (event?.fundraiser?.totalWithdrawn ?? 0);
      setWithdrawalAmount(availableAmount.toString());
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

  if (!event) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Event not found or you don't have permission to withdraw funds from
            this event.
            <Link href="/dashboard" className="block mt-2 underline">
              Return to dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const availableAmount =
    Number(event.fundraiser?.raisedAmount || 0) -
    (event?.fundraiser?.totalWithdrawn ?? 0);

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
          <div className="flex items-center gap-4">
            <img
              src={
                event.fundraiser?.image || "/placeholder.svg?height=64&width=64"
              }
              alt={event.title}
              className="h-16 w-16 rounded object-cover"
              width={64}
              height={64}
            />
            <div>
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-muted-foreground">ID: {event.id}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Raised</div>
              <div className="text-2xl font-bold">
                GH₵ {event.fundraiser?.raisedAmount?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">
                Previously Withdrawn
              </div>
              <div className="text-2xl font-bold">
                GH₵ {event?.fundraiser?.totalWithdrawn?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="text-sm text-muted-foreground">
                Available for Withdrawal
              </div>
              <div className="text-2xl font-bold">
                GH₵ {availableAmount.toLocaleString()}
              </div>
            </div>
          </div>

          {availableAmount <= 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No funds available</AlertTitle>
              <AlertDescription>
                There are currently no funds available for withdrawal. Funds
                become available once donations are processed and any platform
                fees are deducted.
              </AlertDescription>
            </Alert>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Withdrawal Amount (GH₵)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
                    max={String(availableAmount)} // Cast to string here
                    step="0.01"
                    placeholder="Enter amount to withdraw"
                    required
                    className="pr-20"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7"
                    onClick={handleMaxAmount}
                  >
                    Max
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  You can withdraw up to ${availableAmount.toLocaleString()}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Withdrawal Method</Label>
                <RadioGroup
                  value={withdrawalMethod}
                  onValueChange={(val) =>
                    setWithdrawalMethod(val as "bank" | "mobile_money")
                  }
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-3 rounded-md border p-3">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">
                      <div className="font-medium">Bank Account</div>
                      <div className="text-xs text-muted-foreground">
                        Bank transfer
                      </div>
                    </Label>
                    <div className="text-xs text-muted-foreground">
                      2-3 business days
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-md border p-3">
                    <RadioGroupItem value="mobile_money" id="mobile_money" />
                    <Label
                      htmlFor="mobile_money"
                      className="flex-1 cursor-pointer"
                    >
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-xs text-muted-foreground">
                        Mobile wallet transfer
                      </div>
                    </Label>
                    <div className="text-xs text-muted-foreground">Instant</div>
                  </div>
                </RadioGroup>
              </div>
              <div className="space-y-4 border rounded-md p-4 bg-primary-50/30 dark:bg-primary-900/10">
                {withdrawalMethod === "bank" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="bankCode">Select Your Bank *</Label>
                      <Select
                        value={paymentDetails.bankCode}
                        onValueChange={(val) =>
                          handleAccountSelectionChange("bankCode", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your bank" />
                        </SelectTrigger>
                        <SelectContent>
                          {banks.map((bank) => (
                            <SelectItem key={bank.code} value={bank.code}>
                              {bank.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountNumber">Account Number *</Label>
                      <Input
                        id="accountNumber"
                        name="accountNumber"
                        placeholder="Enter your account number"
                        value={paymentDetails.accountNumber}
                        onChange={handlePaymentDetailsChange}
                      />
                    </div>
                  </>
                )}
                {withdrawalMethod === "mobile_money" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNetwork">Mobile Network *</Label>
                      <Select
                        value={paymentDetails.mobileNetwork}
                        onValueChange={(val) =>
                          handleAccountSelectionChange("mobileNetwork", val)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select network" />
                        </SelectTrigger>
                        <SelectContent>
                          {mobileNetworks.map((network) => (
                            <SelectItem key={network.code} value={network.code}>
                              {network.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mobileNumber">Mobile Number *</Label>
                      <Input
                        id="mobileNumber"
                        name="mobileNumber"
                        placeholder="e.g. 0501324249"
                        value={paymentDetails.mobileNumber}
                        onChange={handlePaymentDetailsChange}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the mobile number registered with your mobile
                        money account
                      </p>
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label>Account Holder Name *</Label>
                  <Input
                    id="accountHolderName"
                    name="accountHolderName"
                    placeholder="Name on your account"
                    value={paymentDetails.accountHolderName}
                    onChange={handlePaymentDetailsChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any notes about this withdrawal"
                  className="min-h-20"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Withdrawals typically take 2-3 business days to process for
                  bank transfers and are instant for mobile money. Platform fees
                  may apply to the withdrawal amount.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting || availableAmount <= 0}
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
