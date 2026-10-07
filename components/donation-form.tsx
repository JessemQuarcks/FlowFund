"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
import { EventWithFundraiserAndUser } from "@/types";
import { toMajorUnits } from "@/lib/money";

export function DonationForm({ event }: { event: EventWithFundraiserAndUser }) {
  const [amount, setAmount] = useState<string>("");
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isClient, setIsClient] = useState(false);
  const [donorInfo, setDonorInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    setIsClient(true);
  }, []);

  const predefinedAmounts = ["10", "25", "50", "100", "250", "500"];

  const handleAmountSelect = (selectedAmount: string) => {
    setAmount(selectedAmount);
    if (selectedAmount !== "custom") {
      setCustomAmount("");
    }
  };

  const toggleAnonymous = () => {
    setIsAnonymous(!isAnonymous);
  };

  const handleDonorInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDonorInfo((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isClient || typeof window === "undefined") return;
    if (!event.fundraiser) {
      alert("A fundraiser is yet to be created for this event.");
      return;
    }
    setIsSubmitting(true);

    const finalAmount = amount === "custom" ? customAmount : amount;

    try {
      // The server sets the amount, fundraiser, reference and donor metadata,
      // then returns the access code the popup resumes with. The browser never
      // chooses any of those.
      const initResponse = await fetch("/api/donations/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundraiserId: event.fundraiser.id,
          amount: parseFloat(finalAmount),
          isAnonymous,
          email: donorInfo.email,
          firstName: isAnonymous ? undefined : donorInfo.firstName,
          lastName: isAnonymous ? undefined : donorInfo.lastName,
        }),
      });

      if (!initResponse.ok) {
        const body = await initResponse.json().catch(() => null);
        setIsSubmitting(false);
        alert(body?.message ?? "Could not start the donation");
        return;
      }

      const { accessCode, reference } = await initResponse.json();

      const PayStackPop = (await import("@paystack/inline-js")).default;
      const popUp = new PayStackPop();
      popUp.resumeTransaction(accessCode, {
        onSuccess: () => verifyPayment(reference),
        onCancel: () => {
          setIsSubmitting(false);
          alert("Payment cancelled");
        },
      });
    } catch (error) {
      setIsSubmitting(false);
      console.error("Could not start the donation:", error);
      alert("Could not start the donation. Please try again.");
      return;
    }

    const verifyPayment = async (reference: string) => {
      try {
        const response = await fetch("/api/donations/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference }),
        });

        if (response.ok) {
          const params = new URLSearchParams({
            amount: finalAmount,
            eventId: event.id,
            eventTitle: event.title,
          });
          const eventId = event.id;
          window.location.href = `/events/${eventId}/donate-success?${params.toString()}`;
        } else {
          setIsSubmitting(false);
          alert("Payment verification failed");
        }
      } catch (error) {
        setIsSubmitting(false);
        console.error("Verification error:", error);
      }
    };
  };

  // The fundraiser's minimum is stored in pesewas; the form works in GHS.
  const minimumAmount = Math.max(
    toMajorUnits(event.fundraiser?.minimumAmount ?? 0),
    0.1,
  );
  const selectedAmount = Number.parseFloat(
    amount === "custom" ? customAmount : amount,
  );
  const isAmountValid =
    !!amount &&
    Number.isFinite(selectedAmount) &&
    selectedAmount >= minimumAmount;

  const isDonorInfoValid =
    (isAnonymous && donorInfo.email) ||
    (donorInfo.firstName && donorInfo.lastName && donorInfo.email);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Make a Donation</CardTitle>
        <CardDescription>
          Support this fundraiser with a secure donation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">
              Donation Amount (GH₵)
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {predefinedAmounts
                .filter((value) => Number(value) >= minimumAmount)
                .map((value) => (
                  <div
                    key={value}
                    onClick={() => handleAmountSelect(value)}
                    className={`
                      p-3 rounded-md border text-center cursor-pointer transition-all
                      ${
                        amount === value
                          ? "border-primary-600 bg-primary-100 text-primary-700 font-medium shadow-sm dark:bg-primary-900/50 dark:text-primary-300"
                          : "border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                      }
                    `}
                  >
                    ₵{value}
                  </div>
                ))}
            </div>
            <div
              onClick={() => handleAmountSelect("custom")}
              className={`
                  p-3 rounded-md border text-center cursor-pointer transition-all
                  ${
                    amount === "custom"
                      ? "border-primary-600 bg-primary-100 text-primary-700 font-medium shadow-sm dark:bg-primary-900/50 dark:text-primary-300"
                      : "border-gray-200 hover:border-primary-300 hover:bg-primary-50 dark:border-gray-700 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
                  }
                `}
            >
              Custom Amount
            </div>
          </div>

          {amount === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom-amount">Custom Amount (GH₵)</Label>
              <Input
                id="custom-amount"
                type="number"
                min={minimumAmount}
                step="0.01"
                placeholder="Enter amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
              />
              <p className="text-sm text-neutral-500">
                Minimum donation: GH₵{minimumAmount.toLocaleString()}
              </p>
            </div>
          )}

          <div
            className="flex items-center gap-3 p-3 rounded-md border border-gray-200 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800/50"
            onClick={toggleAnonymous}
          >
            <div
              className={`
                  w-5 h-5 rounded border flex items-center justify-center transition-colors
                  ${
                    isAnonymous
                      ? "bg-primary-600 border-primary-600"
                      : "border-gray-300 dark:border-gray-600"
                  }
                `}
            >
              {isAnonymous && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5 text-white"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>
            <Label className="cursor-pointer m-0">Donate anonymously</Label>
          </div>

          {!isAnonymous ? (
            <div className="space-y-4">
              <Label className="text-base font-medium">Donor Information</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={donorInfo.firstName}
                    onChange={handleDonorInfoChange}
                    required={!isAnonymous}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={donorInfo.lastName}
                    onChange={handleDonorInfoChange}
                    required={!isAnonymous}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={donorInfo.email}
                  onChange={handleDonorInfoChange}
                  required={!isAnonymous}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={donorInfo.email}
                onChange={handleDonorInfoChange}
                required={isAnonymous}
              />
              <p className="text-sm text-neutral-500">
                For receipt purposes only. Your email will not be shared or
                saved.
              </p>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={!isAmountValid || !isDonorInfoValid}
              className="flex items-center gap-2"
            >
              {isSubmitting
                ? "Processing..."
                : `Donate ${amount && isAmountValid ? "GH₵" : "Amount"}${
                    !isAmountValid
                      ? ""
                      : amount === "custom"
                        ? customAmount
                        : amount
                  }`}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
