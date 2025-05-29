import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Clock, Share2, Users } from "lucide-react";
import { DonationForm } from "@/components/donation-form";
import { DonorsList } from "@/components/donors-list";
import { prisma } from "@/lib/prisma"; // Import prisma client

export default async function EventPage({ params }: { params:Promise<{ id: string }> }) {
   // No need to await params, it's already available
   const {id}= await params;
  // Fetch the event and its associated fundraiser from the database
  const event = await prisma.event.findUnique({
    where: {
      id: id,
    },
    include: {
      fundraiser: true, // Include the related fundraiser data
    },
  });

  // Handle case where event is not found
  if (!event) {
    return (
      <div className="container py-8 text-center">
        <h1 className="text-3xl font-bold">Event Not Found</h1>
        <p className="text-muted-foreground">
          The event you are looking for does not exist.
        </p>
        <Link href="/events" className="mt-4 inline-block">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  // Calculate progress and days left dynamically
  const progress = event.fundraiser
    ? Math.round((Number(event.fundraiser.raisedAmount) / Number(event.fundraiser.targetAmount)) * 100)
    : 0;

  const daysLeft = event.fundraiser?.endDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(event.fundraiser.endDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Format creation date
  const createdAt = new Date(event.dateAdded).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
              src={event.fundraiser?.image || "/placeholder.svg"} // Use event image from fundraiser
              alt={event.title}
              className="relative w-full rounded-lg object-cover aspect-video"
              width={800}
              height={400}
            />
          </div>

          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold green-text-gradient">
              {event.title}
            </h1>
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
              <span>Created {createdAt}</span>
            </div>
            {/* You might not have createdBy in your Prisma Event model directly.
                If it's linked to a User, you'd fetch it. For now, removed or
                you can keep a placeholder if needed.
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-primary-500" />
              <span>By {event.createdBy}</span>
            </div>
            */}
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-primary-500" />
              <span>{daysLeft} days left</span>
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
              <p>{event.description}</p> {/* Use event.description */}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="gradient-card">
                  <CardHeader>
                    <CardTitle>Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Category</span>
                      <span className="font-medium text-primary-600">
                        {event.category}
                      </span>
                    </div>
                    {/* If you have a location field in your Event model, display it here */}
                    {/* <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span>{event.location}</span>
                    </div> */}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span>{createdAt}</span>
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
                      <span className="font-medium">
                        $
                        {event.fundraiser?.targetAmount.toLocaleString() ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Raised</span>
                      <span className="font-medium text-primary-600">
                        $
                        {event.fundraiser?.raisedAmount.toLocaleString() ||
                          "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Donors</span>
                      <span>{event.fundraiser?.donorCount || 0}</span>
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
                  <CardDescription>
                    Stay informed about our progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-primary-600">
                          Site preparation completed!
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          2 days ago
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We've cleared the site and prepared the ground for the
                        raised beds. Thanks to all volunteers who helped!
                      </p>
                    </div>
                    <div className="border-b pb-4">
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-primary-600">
                          Materials ordered
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          1 week ago
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We've ordered lumber, soil, and initial plants. Delivery
                        expected next week.
                      </p>
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <h3 className="font-semibold text-primary-600">
                          Fundraising launched!
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          2 weeks ago
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        We're excited to launch our fundraising campaign for the
                        community garden project!
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
                    ${event.fundraiser?.raisedAmount.toLocaleString() || 0}{" "}
                    raised of $
                    {event.fundraiser?.targetAmount.toLocaleString() || 0}
                  </span>
                  <span className="font-medium text-primary-600">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-primary-500" />
                  <span>{event.fundraiser?.donorCount || 0} donors</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-primary-500" />
                  <span>{daysLeft} days left</span>
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
              {/* This section still uses hardcoded donor data. 
                  You would need to fetch actual donation data for this event from your database
                  and render it dynamically, potentially using a similar pattern to DonorsList.
              */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 flex items-center justify-center">
                      JD
                    </div>
                    <div>
                      <div className="font-medium">John Doe</div>
                      <div className="text-xs text-muted-foreground">
                        2 hours ago
                      </div>
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
                      <div className="text-xs text-muted-foreground">
                        5 hours ago
                      </div>
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
                      <div className="text-xs text-muted-foreground">
                        1 day ago
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-primary-600">$25</div>
                </div>
                <Link
                  href={`/events/${event.id}/donors`} // Link to a dedicated donors page for this event
                  className="text-sm text-primary-600 hover:underline block text-center"
                >
                  View all donors
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}