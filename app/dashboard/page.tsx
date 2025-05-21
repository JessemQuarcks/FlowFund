import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Edit, Plus } from "lucide-react"

export default function DashboardPage() {
  // In a real app, this would be fetched from a database
  const myEvents = [
    {
      id: "1",
      title: "Community Garden Project",
      description: "Help us build a community garden in the heart of downtown.",
      target: 5000,
      raised: 3750,
      donors: 48,
      daysLeft: 12,
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
      image: "/placeholder.svg?height=200&width=400",
    },
  ]

  const donations = [
    { id: "1", eventTitle: "Animal Shelter Renovation", amount: 50, date: "May 15, 2023" },
    { id: "2", eventTitle: "Community Garden Project", amount: 100, date: "April 28, 2023" },
    { id: "3", eventTitle: "Local School Fundraiser", amount: 75, date: "March 12, 2023" },
  ]

  const withdrawals = [
    { id: "1", eventTitle: "Community Garden Project", amount: 1500, date: "May 10, 2023", status: "Completed" },
    { id: "2", eventTitle: "Local School Fundraiser", amount: 800, date: "April 22, 2023", status: "Completed" },
  ]

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold green-text-gradient">Dashboard</h1>
        <Link href="/events/create">
          <Button variant="gradient">
            <Plus className="mr-2 h-4 w-4" /> Create Event
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="my-events">
        <TabsList className="mb-6 bg-primary-50 dark:bg-primary-900">
          <TabsTrigger
            value="my-events"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
          >
            My Events
          </TabsTrigger>
          <TabsTrigger
            value="donations"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
          >
            My Donations
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
          >
            Withdrawals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-events">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {myEvents.map((event) => (
              <Card key={event.id} className="overflow-hidden">
                <img
                  src={event.image || "/placeholder.svg"}
                  alt={event.title}
                  className="aspect-video w-full object-cover"
                  width={400}
                  height={200}
                />
                <CardHeader>
                  <CardTitle>{event.title}</CardTitle>
                  <CardDescription>{event.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          ${event.raised.toLocaleString()} raised of ${event.target.toLocaleString()}
                        </span>
                        <span className="font-medium text-primary-600">
                          {Math.round((event.raised / event.target) * 100)}%
                        </span>
                      </div>
                      <Progress value={(event.raised / event.target) * 100} className="h-2" />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <div>{event.donors} donors</div>
                      <div>{event.daysLeft} days left</div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Link href={`/events/${event.id}/edit`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                    >
                      <Edit className="mr-2 h-4 w-4" /> Edit
                    </Button>
                  </Link>
                  <Link href={`/events/${event.id}/withdraw`}>
                    <Button size="sm" variant="gradient-secondary">
                      Withdraw Funds
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>My Donations</CardTitle>
              <CardDescription>A record of all your contributions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {donations.map((donation) => (
                  <div key={donation.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <div className="font-medium">{donation.eventTitle}</div>
                      <div className="text-sm text-muted-foreground">Donated on {donation.date}</div>
                    </div>
                    <div className="font-medium text-primary-600">${donation.amount}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>A record of all your withdrawals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {withdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div>
                      <div className="font-medium">{withdrawal.eventTitle}</div>
                      <div className="text-sm text-muted-foreground">Withdrawn on {withdrawal.date}</div>
                    </div>
                    <div className="space-y-1 text-right">
                      <div className="font-medium text-primary-600">${withdrawal.amount}</div>
                      <div className="text-xs text-muted-foreground">{withdrawal.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
