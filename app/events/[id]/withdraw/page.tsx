"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EventData {
  id: string
  title: string
  description: string
  userId: string
  fundraiser: {
    id: string
    targetAmount: number
    raisedAmount: number
    totalWithdrawn: number
    image: string | null
    endDate: Date
    anonymity: boolean
    minimumAmount: number
    donorCount: number
  } | null
  user: {
    name: string | null
  }
}

export default function WithdrawFundsPage({ params }: { params: { id: string } }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [event, setEvent] = useState<EventData | null>(null)
  const [withdrawalMethod, setWithdrawalMethod] = useState("bank")
  const [withdrawalAmount, setWithdrawalAmount] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/events/${params.id}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch event')
        }
        
        const eventData = await response.json()
        setEvent(eventData)
      } catch (error) {
        console.error('Error fetching event:', error)
        setError('Failed to load event details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const amount = Number.parseFloat(withdrawalAmount)
    const availableAmount = event?.fundraiser 
      ? Number(event.fundraiser.raisedAmount) - Number(event.fundraiser.totalWithdrawn)
      : 0

    // Validate withdrawal amount
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid withdrawal amount")
      setIsSubmitting(false)
      return
    }

    if (amount > availableAmount) {
      setError(`You can only withdraw up to $${availableAmount.toLocaleString()}`)
      setIsSubmitting(false)
      return
    }

    try {
      const formData = new FormData(e.currentTarget)
      
      const withdrawalData = {
        eventId: params.id,
        fundraiserId: event?.fundraiser?.id,
        amount,
        accountType: withdrawalMethod === 'bank' ? 'BANK_ACCOUNT' : 'MOBILE_MONEY',
        notes: formData.get("notes") as string || null,
      }

      const response = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(withdrawalData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit withdrawal request')
      }

      const result = await response.json()
      
      // Update the event data to reflect the new withdrawal
      if (event?.fundraiser) {
        setEvent({
          ...event,
          fundraiser: {
            ...event.fundraiser,
            totalWithdrawn: Number(event.fundraiser.totalWithdrawn) + amount
          }
        })
      }

      alert("Withdrawal request submitted successfully!")
      setWithdrawalAmount("")
      
    } catch (error) {
      console.error('Withdrawal error:', error)
      setError(error instanceof Error ? error.message : 'Failed to submit withdrawal request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMaxAmount = () => {
    if (event?.fundraiser) {
      const availableAmount = Number(event.fundraiser.raisedAmount) - Number(event.fundraiser.totalWithdrawn)
      setWithdrawalAmount(availableAmount.toString())
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Event not found or you don't have permission to withdraw funds from this event.
            <Link href="/dashboard" className="block mt-2 underline">
              Return to dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!event.fundraiser) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertTitle>No Fundraiser</AlertTitle>
          <AlertDescription>
            This event does not have an associated fundraiser. Only events with active fundraisers can have fund withdrawals.
            <Link href={`/events/${params.id}`} className="block mt-2 underline">
              Return to event
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const raisedAmount = Number(event.fundraiser.raisedAmount)
  const withdrawnAmount = Number(event.fundraiser.totalWithdrawn)
  const availableAmount = raisedAmount - withdrawnAmount

  return (
    <div className="container py-8 max-w-3xl">
      <Link
        href={`/events/${params.id}`}
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Event</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw Funds</CardTitle>
          <CardDescription>Withdraw available funds from your fundraiser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <img
              src={event.fundraiser.image || "/placeholder.svg?height=64&width=64"}
              alt={event.title}
              className="h-16 w-16 rounded object-cover"
              width={64}
              height={64}
            />
            <div>
              <h3 className="font-medium">{event.title}</h3>
              <p className="text-sm text-muted-foreground">ID: {event.id}</p>
              <p className="text-sm text-muted-foreground">Organizer: {event.user.name || 'Anonymous'}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Total Raised</div>
              <div className="text-2xl font-bold">${raisedAmount.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground">Previously Withdrawn</div>
              <div className="text-2xl font-bold">${withdrawnAmount.toLocaleString()}</div>
            </div>
            <div className="rounded-lg border p-4 bg-primary/5">
              <div className="text-sm text-muted-foreground">Available for Withdrawal</div>
              <div className="text-2xl font-bold">${availableAmount.toLocaleString()}</div>
            </div>
          </div>

          {availableAmount <= 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>No funds available</AlertTitle>
              <AlertDescription>
                There are currently no funds available for withdrawal. Funds become available once donations are
                processed and any platform fees are deducted.
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
                <Label htmlFor="amount">Withdrawal Amount ($)</Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    max={availableAmount}
                    value={withdrawalAmount}
                    onChange={(e) => setWithdrawalAmount(e.target.value)}
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
                <RadioGroup value={withdrawalMethod} onValueChange={setWithdrawalMethod} className="space-y-3">
                  <div className="flex items-center space-x-3 rounded-md border p-3">
                    <RadioGroupItem value="bank" id="bank" />
                    <Label htmlFor="bank" className="flex-1 cursor-pointer">
                      <div className="font-medium">Bank Account</div>
                      <div className="text-xs text-muted-foreground">Bank transfer</div>
                    </Label>
                    <div className="text-xs text-muted-foreground">2-3 business days</div>
                  </div>
                  <div className="flex items-center space-x-3 rounded-md border p-3">
                    <RadioGroupItem value="mobile" id="mobile" />
                    <Label htmlFor="mobile" className="flex-1 cursor-pointer">
                      <div className="font-medium">Mobile Money</div>
                      <div className="text-xs text-muted-foreground">Mobile wallet transfer</div>
                    </Label>
                    <div className="text-xs text-muted-foreground">Instant</div>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Add any notes about this withdrawal"
                  className="min-h-20"
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  Withdrawals typically take 2-3 business days to process for bank transfers and are instant for mobile money. 
                  Platform fees may apply to the withdrawal amount.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || availableAmount <= 0}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
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
  )
}