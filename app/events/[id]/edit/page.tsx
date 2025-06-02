"use client"
import type React from "react"
import { useState, useEffect,use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Loader2, Upload, X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface EventData {
  id: string
  title: string
  description: string
  category: string
  target: number
  endDate: string
  minDonation: number | null
  maxDonation: number | null
  allowAnonymous: boolean
  image: string | null
  raisedAmount: number
  donorCount: number
}

export default function EditEventPage({ params }: { params:Promise<{ id: string }> }) {
  const {id} =use(params);
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${id}`)
        if (!response.ok) {
          throw new Error('Failed to fetch event')
        }
        const data = await response.json()
        setEvent(data)
        setImagePreview(data.image)
      } catch (error) {
        setError('Failed to load event')
        console.error('Error fetching event:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image file size must be less than 5MB')
        return
      }
      
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file')
        return
      }

      setSelectedImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
      setError(null)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(event?.image || null) // Reset to original image
    // Reset file input
    const fileInput = document.getElementById('image') as HTMLInputElement
    if (fileInput) {
      fileInput.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)


    const formData = new FormData(e.currentTarget) 
    formData.append("title", e.currentTarget.title)
    formData.append("description", e.currentTarget.description.value)
    formData.append("target", e.currentTarget.target)
     const category = (document.querySelector('select[name="category"]') as HTMLSelectElement)?.value
  if (category) {
    formData.set("category", category)
  }
    formData.append("endDate", e.currentTarget.endDate.value)
    formData.append("minDonation", e.currentTarget.minDonation?.value || '')
    formData.append("maxDonation", e.currentTarget.maxDonation?.value || '')
    formData.append("allowAnonymous", e.currentTarget.allowAnonymous.checked ? 'true' : 'false')
    if (selectedImage) {
      formData.append("image", selectedImage)
    }
    try {
      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to update event: ${errorData.message}`);
      }
      const result = await response.json();
      
      // Update redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      setError('Failed to update event. Please try again.')
      console.error('Error updating event:', error)
    } finally {
      setIsSubmitting(false)
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
            Event not found or you don't have permission to edit this event.
            <Link href="/dashboard" className="block mt-2 underline">
              Return to dashboard
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Link
        href="/dashboard"
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Dashboard</span>
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>Edit Fundraising Event</CardTitle>
          <CardDescription>Update your fundraising event details</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Event Title</Label>
              <Input id="title" name="title" defaultValue={event.title} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Short Description</Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={event.description}
                placeholder="A brief summary of your fundraiser (shown in listings)"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="target">Target Amount ($)</Label>
                <Input id="target" name="target" type="number" min="1" step="1" defaultValue={event.target} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category" defaultValue={event.category}>
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
              <Input id="endDate" name="endDate" type="date" defaultValue={event.endDate} required />
            </div>

            <div className="space-y-2">
              <Label>Donation Range (Optional)</Label>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="minDonation" className="text-xs text-muted-foreground">
                    Minimum ($)
                  </Label>
                  <Input
                    id="minDonation"
                    name="minDonation"
                    type="number"
                    min="1"
                    step="1"
                    defaultValue={event.minDonation}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="allowAnonymous"
                name="allowAnonymous"
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                defaultChecked={event.allowAnonymous}
              />
              <Label htmlFor="allowAnonymous">Allow anonymous donations</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Cover Image</Label>
              {imagePreview && (
                <div className="relative inline">
                  <img
                    src={imagePreview}
                    alt="Event cover image"
                    className="h-32 w-32 rounded-lg object-cover border "
                    width={10}
                    height={8}
                  />
                  {selectedImage && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={removeImage}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Upload className="h-4 w-4" />
                  <span>Upload new image</span>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground">
                Recommended size: 1200x630 pixels. Max file size: 5MB. 
                Supported formats: JPG, PNG, WebP.
              </p>
              
              {selectedImage && (
                <p className="text-xs text-green-600">
                  New image selected: {selectedImage.name}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" type="button" asChild>
              <Link href={`/events/${id}`}>Cancel</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
