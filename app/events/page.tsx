import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Users, Clock, Filter } from "lucide-react"

export default function EventsPage() {
  // In a real app, this would be fetched from a database
  const events = [
    {
      id: "1",
      title: "Community Garden Project",
      description: "Help us build a community garden in the heart of downtown.",
      target: 5000,
      raised: 3750,
      donors: 48,
      daysLeft: 12,
      category: "Community",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "2",
      title: "Local School Fundraiser",
      description: "Supporting our local school with new educational materials.",
      target: 2500,
      raised: 1800,
      donors: 32,
      daysLeft: 8,
      category: "Education",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "3",
      title: "Animal Shelter Renovation",
      description: "Help us renovate our animal shelter to provide better care.",
      target: 10000,
      raised: 4200,
      donors: 67,
      daysLeft: 20,
      category: "Animals",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "4",
      title: "Medical Treatment Fund",
      description: "Support Sarah's cancer treatment and recovery journey.",
      target: 25000,
      raised: 18750,
      donors: 215,
      daysLeft: 30,
      category: "Medical",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "5",
      title: "Disaster Relief Effort",
      description: "Providing essential supplies to families affected by recent floods.",
      target: 15000,
      raised: 9800,
      donors: 124,
      daysLeft: 15,
      category: "Emergency",
      image: "/placeholder.svg?height=200&width=400",
    },
    {
      id: "6",
      title: "Youth Sports Program",
      description: "Funding equipment and travel for underprivileged youth sports teams.",
      target: 7500,
      raised: 3200,
      donors: 45,
      daysLeft: 25,
      category: "Community",
      image: "/placeholder.svg?height=200&width=400",
    },
  ]

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
                    <SelectItem value="community">Community</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="medical">Medical</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
                    <SelectItem value="animals">Animals</SelectItem>
                    <SelectItem value="environment">Environment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
          {events.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              <img
                src={event.image || "/placeholder.svg"}
                alt={event.title}
                className="aspect-video w-full object-cover"
                width={400}
                height={200}
              />
              <CardHeader>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                    {event.category}
                  </span>
                </div>
                <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                <CardDescription className="line-clamp-2">{event.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>
                        ${event.raised.toLocaleString()} raised of ${event.target.toLocaleString()}
                      </span>
                      <span>{Math.round((event.raised / event.target) * 100)}%</span>
                    </div>
                    <Progress value={(event.raised / event.target) * 100} className="h-2" />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{event.donors} donors</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{event.daysLeft} days left</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href={`/events/${event.id}`} className="w-full">
                  <Button className="w-full">View Fundraiser</Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
