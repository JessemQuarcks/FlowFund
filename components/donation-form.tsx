"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useRouter } from "next/navigation"

export function DonationForm({ eventId }: { eventId: string }) {
  const router = useRouter()
  const [amount, setAmount] = useState<string>("")
  const [customAmount, setCustomAmount] = useState<string>("")
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // In a real app, this would submit to an API
    const donationAmount = amount === "custom" ? customAmount : amount

    console.log({
      eventId,
      amount: donationAmount,
      isAnonymous,
    })

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      // Show success message
      alert(`Thank you for your donation of $${donationAmount}!`)

      // Reset form
      setAmount("")
      setCustomAmount("")
      setIsAnonymous(false)
    }, 1000)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Donation Amount</Label>
        <RadioGroup
          value={amount}
          onValueChange={setAmount}
          className="grid grid-cols-3 gap-2"
        >
          <Label
            htmlFor="amount-25"
            className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
              amount === "25"
                ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                : "border-input"
            }`}
          >
            <RadioGroupItem value="25" id="amount-25" className="sr-only" />
            ₵25
          </Label>
          <Label
            htmlFor="amount-50"
            className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
              amount === "50"
                ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                : "border-input"
            }`}
          >
            <RadioGroupItem value="50" id="amount-50" className="sr-only" />
            ₵50
          </Label>
          <Label
            htmlFor="amount-100"
            className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
              amount === "100"
                ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                : "border-input"
            }`}
          >
            <RadioGroupItem value="100" id="amount-100" className="sr-only" />
            ₵100
          </Label>
          <Label
            htmlFor="amount-250"
            className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
              amount === "250"
                ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                : "border-input"
            }`}
          >
            <RadioGroupItem value="250" id="amount-250" className="sr-only" />
            ₵250
          </Label>
          <Label
            htmlFor="amount-500"
            className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
              amount === "500"
                ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                : "border-input"
            }`}
          >
            <RadioGroupItem value="500" id="amount-500" className="sr-only" />
            ₵500
          </Label>
          <Label
            htmlFor="amount-custom"
            className={`flex cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
              amount === "custom"
                ? "border-primary-500 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
                : "border-input"
            }`}
          >
            <RadioGroupItem
              value="custom"
              id="amount-custom"
              className="sr-only"
            />
            Custom
          </Label>
        </RadioGroup>
      </div>

      {amount === "custom" && (
        <div className="space-y-2">
          <Label htmlFor="custom-amount">Custom Amount</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2">₵</span>
            <Input
              id="custom-amount"
              type="number"
              min="1"
              step="1"
              placeholder="Enter amount"
              className="pl-7"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              required
            />
          </div>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="anonymous"
          checked={isAnonymous}
          onCheckedChange={setIsAnonymous}
        />
        <Label htmlFor="anonymous" className="cursor-pointer">
          Donate anonymously
        </Label>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={
          !amount || (amount === "custom" && !customAmount) || isSubmitting
        }
        variant="gradient"
        onClick={() => {
          if (!amount || (amount === "custom" && !customAmount)) {
            alert("Please select or enter a donation amount");
            return;
          }
        }}
      >
        {isSubmitting ? "Processing..." : "Donate Now"}
      </Button>
    </form>
  );
}
