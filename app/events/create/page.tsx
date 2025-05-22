"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft } from "lucide-react"

export default function CreateEventPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)

    const formData = new FormData(e.currentTarget)
    
    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.get("title"),
          description: formData.get("description"),
          target: Number(formData.get("target")),
          category: formData.get("category"),
          endDate: formData.get("endDate"),
          minDonation: formData.get("minDonation") ? Number(formData.get("minDonation")) : null,
          maxDonation: formData.get("maxDonation") ? Number(formData.get("maxDonation")) : null,
          allowAnonymous: formData.get("allowAnonymous") === "on",
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to create event')
      }

      const event = await response.json()
      router.push(`/events/${event.id}`)
    } catch (error) {
      console.error('Failed to create event:', error)
      alert('Failed to create event. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
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
          <CardTitle className="green-text-gradient">Create Fundraising Event</CardTitle>
          <CardDescription>Set up your fundraising event with all the necessary details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" placeholder="Enter a clear, descriptive title" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your fundraising event and why people should donate"
                className="min-h-32"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount ($)</Label>
                <Input id="target" name="target" type="number" min="1" step="1" placeholder="5000" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue="community">
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="nonprofit">Nonprofit</SelectItem>
                    <SelectItem value="animals">Animals</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input id="endDate" name="endDate" type="date" required />
            </div>

            <div className="space-y-2">
              <Label>Donation Range (Optional)</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="minDonation" className="text-xs text-muted-foreground">
                    Minimum ($)
                  </Label>
                  <Input id="minDonation" name="minDonation" type="number" min="1" step="1" placeholder="5" />
                </div>
                <div>
                  <Label htmlFor="maxDonation" className="text-xs text-muted-foreground">
                    Maximum ($)
                  </Label>
                  <Input id="maxDonation" name="maxDonation" type="number" min="1" step="1" placeholder="1000" />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowAnonymous"
                name="allowAnonymous"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                defaultChecked
              />
              <Label htmlFor="allowAnonymous">Allow anonymous donations</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Cover Image</Label>
              <Input id="image" name="image" type="file" accept="image/*" />
              <p className="text-xs text-muted-foreground">Recommended size: 1200x630 pixels. Max file size: 5MB.</p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href="/dashboard">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="gradient">
              {isSubmitting ? "Creating..." : "Create Event"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
