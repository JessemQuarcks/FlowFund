import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Clock, Filter } from "lucide-react"
import { prisma } from "@/lib/prisma"

export default async function EventsPage() {
  // Fetch events from database with their fundraiser data
  const events = await prisma.event.findMany({
    include: {
      fundraiser: true,
      user: {
        select: {
          name: true,
        }
      }
    },
    orderBy: {
      dateAdded: 'desc'
    }
  });

  // Helper function to get category display name
  const getCategoryDisplayName = (category: string) => {
    const categoryMap: { [key: string]: string } = {
      COMMUNITY: "Community",
      EDUCATIONAL: "Education", 
      ENVIRONMENT: "Environment",
      MEDICAL: "Medical",
      NONPROFIT: "Nonprofit",
      EMERGENCY: "Emergency",
      ANIMALS: "Animals",
      OTHER: "Other"
    };
    return categoryMap[category] || category;
  };

  // Helper function to calculate days left
  const getDaysLeft = (endDate: Date | null) => {
    if (!endDate) return 0;
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Discover Fundraisers</h1>
          <p className="text-muted-foreground mt-1">Find and support causes that matter to you</p>
        </div>
        <Link href="/events/create">
          <Button>Start a Fundraiser</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Search</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search fundraisers..." className="pl-8" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select defaultValue="all">
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="COMMUNITY">Community</SelectItem>
                    <SelectItem value="EDUCATIONAL">Education</SelectItem>
                    <SelectItem value="MEDICAL">Medical</SelectItem>
                    <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    <SelectItem value="ANIMALS">Animals</SelectItem>
                    <SelectItem value="ENVIRONMENT">Environment</SelectItem>
                    <SelectItem value="NONPROFIT">Nonprofit</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <Select defaultValue="trending">
                  <SelectTrigger>
                    <SelectValue placeholder="Sort By" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="most-funded">Most Funded</SelectItem>
                    <SelectItem value="ending-soon">Ending Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Goal Amount</label>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Min" min="0" />
                  <Input type="number" placeholder="Max" min="0" />
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No fundraisers found. Be the first to create one!</p>
              <Link href="/events/create" className="mt-4 inline-block">
                <Button>Start a Fundraiser</Button>
              </Link>
            </div>
          ) : (
            events.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <img
                  src={event.fundraiser?.image || "/placeholder.svg?height=200&width=400"}
                  alt={event.title}
                  className="aspect-video w-full object-cover"
                  width={400}
                  height={200}
                />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {getCategoryDisplayName(event.category)}
                    </span>
                  </div>
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {event.fundraiser && (
                      <>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              ${Number(event.fundraiser.raisedAmount).toLocaleString()} raised of ${Number(event.fundraiser.targetAmount).toLocaleString()}
                            </span>
                            <span className="font-medium text-primary-600">
                              {Math.round((Number(event.fundraiser.raisedAmount) / Number(event.fundraiser.targetAmount)) * 100)}%
                            </span>
                          </div>
                          <Progress 
                            value={(Number(event.fundraiser.raisedAmount) / Number(event.fundraiser.targetAmount)) * 100} 
                            className="h-2" 
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{event.fundraiser.donorCount} donors</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{getDaysLeft(event.fundraiser.endDate)} days left</span>
                          </div>
                        </div>
                      </>
                    )}
                    {!event.fundraiser && (
                      <div className="text-sm text-muted-foreground">
                        <p>Event details only - no fundraising component</p>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter>
                  <Link href={`/events/${event.id}`} className="w-full">
                    <Button className="w-full">
                      {event.fundraiser ? 'Donate Now' : 'View Event'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}