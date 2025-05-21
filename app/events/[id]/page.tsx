import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Calendar, Clock, Share2, Users } from "lucide-react"
import { DonationForm } from "@/components/donation-form"
import { DonorsList } from "@/components/donors-list"

export default async function EventPage({ params }: { params: { id: string } }) {
  // Await the params before accessing id
  const { id } = await params

  // In a real app, this would fetch from a database
  const event = {
    id: id,  // Updated to use the awaited id
    title: "Community Garden Project",
    description:
      "Help us build a community garden in the heart of downtown. This project will transform an unused lot into a vibrant space where neighbors can grow food, flowers, and community connections.",
    longDescription:
      "Our community garden project aims to create a sustainable, accessible green space in an urban environment. The garden will feature raised beds for vegetables, a butterfly garden, seating areas, and educational signage. We'll use sustainable practices and provide opportunities for community members of all ages and abilities to participate. Funds will go toward soil, lumber, plants, tools, irrigation systems, and educational materials.",
    target: 5000,
    raised: 3750,
    donors: 48,
    daysLeft: 12,
    createdBy: "Sarah Johnson",
    createdAt: "2023-10-15",
    category: "Community",
    location: "Downtown, Cityville",
    image: "/placeholder.svg?height=400&width=800",
  }

  const progress = Math.round((event.raised / event.target) * 100)

  return (
    <div className="container py-8 max-w-5xl">
      <Link
        href="/events"
        className="flex items-center gap-2 text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Back to Events</span>
      </Link>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-green-gradient blur-md opacity-30"></div>
            <img
              src={event.image || "/placeholder.svg"}
              alt={event.title}
              className="relative w-full rounded-lg object-cover aspect-video"
              width={800}
              height={400}
            />
          </div>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold green-text-gradient">{event.title}</h1>
            <Button
              variant="outline"
              size="icon"
              className="border-primary-200 hover:bg-primary-50 hover:text-primary-700"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-primary-500" />
              <span>Created {event.createdAt}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary-500" />
              <span>By {event.createdBy}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary-500" />
              <span>{event.daysLeft} days left</span>
            </div>
          </div>

          <Tabs defaultValue="about">
            <TabsList className="bg-primary-50 dark:bg-primary-900">
              <TabsTrigger
                value="about"
                className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
              >
                About
              </TabsTrigger>
              <TabsTrigger
                value="donors"
                className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
              >
                Donors
              </TabsTrigger>
              <TabsTrigger
                value="updates"
                className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
              >
                Updates
              </TabsTrigger>
            </TabsList>
            <TabsContent value="about" className="space-y-4">
              <p>{event.longDescription}</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium text-primary-600">{event.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span>{event.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{event.createdAt}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle>Funding</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Target</span>
                      <span className="font-medium">${event.target.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Raised</span>
                      <span className="font-medium text-primary-600">${event.raised.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Donors</span>
                      <span>{event.donors}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="donors">
              <DonorsList eventId={event.id} />
            </TabsContent>
            <TabsContent value="updates">
              <Card>
                <CardHeader>
                  <CardTitle>Project Updates</CardTitle>
                  <CardDescription>Stay informed about our progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-primary-600">Site preparation completed!</h3>
                        <span className="text-sm text-muted-foreground">2 days ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We've cleared the site and prepared the ground for the raised beds. Thanks to all volunteers who
                        helped!
                      </p>
                    </div>
                    <div className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-primary-600">Materials ordered</h3>
                        <span className="text-sm text-muted-foreground">1 week ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We've ordered lumber, soil, and initial plants. Delivery expected next week.
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-primary-600">Fundraising launched!</h3>
                        <span className="text-sm text-muted-foreground">2 weeks ago</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We're excited to launch our fundraising campaign for the community garden project!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Fundraising Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    ${event.raised.toLocaleString()} raised of ${event.target.toLocaleString()}
                  </span>
                  <span className="font-medium text-primary-600">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary-500" />
                  <span>{event.donors} donors</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary-500" />
                  <span>{event.daysLeft} days left</span>
                </div>
              </div>
              <DonationForm eventId={event.id} />
            </CardContent>
          </Card>

          <Card className="gradient-card">
            <CardHeader>
              <CardTitle>Recent Donors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                      JD
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-xs text-muted-foreground">2 hours ago</div>
                    </div>
                  </div>
                  <div className="font-medium text-primary-600">$50</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                      AS
                    </div>
                    <div>
                      <div className="font-medium">Anonymous Supporter</div>
                      <div className="text-xs text-muted-foreground">5 hours ago</div>
                    </div>
                  </div>
                  <div className="font-medium text-primary-600">$100</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                      MS
                    </div>
                    <div>
                      <div className="font-medium">Maria Smith</div>
                      <div className="text-xs text-muted-foreground">1 day ago</div>
                    </div>
                  </div>
                  <div className="font-medium text-primary-600">$25</div>
                </div>
                <Link href="#" className="text-sm text-primary-600 hover:underline block text-center">
                  View all donors
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
