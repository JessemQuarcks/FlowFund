import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Edit, Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth"; // Adjust path as needed
import { EventWithDaysLeft } from "@/types";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    // Handle unauthenticated user - redirect or show login
    return <div>Please log in to view your dashboard</div>;
  }

  // Fetch user's events with fundraiser data
  const myEvents = await prisma.event.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      fundraiser: true,
    },
    orderBy: {
      dateAdded: "desc",
    },
  });

  const events: EventWithDaysLeft[] = myEvents.map((e) => ({
    ...e,
    daysLeft: e.fundraiser?.endDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(e.fundraiser.endDate).getTime() - Date.now()) /
              (1000 * 60 * 60 * 24)
          )
        )
      : 0,
  }));

  // Fetch user's donations
  const donations = await prisma.donation.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      fundraiser: {
        include: {
          event: true,
        },
      },
    },
    orderBy: {
      dateAdded: "desc",
    },
  });

  // Fetch user's withdrawals
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      fundraiser: {
        include: {
          event: true,
        },
      },
    },
    orderBy: {
      dateAdded: "desc",
    },
  });

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
            My Events ({myEvents.length})
          </TabsTrigger>
          <TabsTrigger
            value="donations"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
          >
            My Donations ({donations.length})
          </TabsTrigger>
          <TabsTrigger
            value="withdrawals"
            className="data-[state=active]:bg-primary-100 data-[state=active]:text-primary-700 dark:data-[state=active]:bg-primary-800 dark:data-[state=active]:text-primary-300"
          >
            Withdrawals ({withdrawals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-events">
          {events.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first fundraising event to get started.
                </p>
                <Link href="/events/create">
                  <Button variant="gradient">
                    <Plus className="mr-2 h-4 w-4" /> Create Event
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <img
                    src={event.fundraiser?.image || "/placeholder.svg"}
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
                    {event.fundraiser ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              $
                              {Number(
                                event.fundraiser.raisedAmount
                              ).toLocaleString()}{" "}
                              raised of $
                              {Number(
                                event.fundraiser.targetAmount
                              ).toLocaleString()}
                            </span>
                            <span className="font-medium text-primary-600">
                              {Math.round(
                                (Number(event.fundraiser.raisedAmount) /
                                  Number(event.fundraiser.targetAmount)) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (Number(event.fundraiser.raisedAmount) /
                                Number(event.fundraiser.targetAmount)) *
                              100
                            }
                            className="h-2"
                          />
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <div>{event.fundraiser.donorCount} donors</div>
                          <div>{`${event.daysLeft} days left`}</div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Fundraiser not set up yet
                      </p>
                    )}
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
                    {event.fundraiser &&
                      Number(event.fundraiser.raisedAmount) >
                        Number(event.fundraiser.totalWithdrawn) && (
                        <Link href={`/events/${event.id}/withdraw`}>
                          <Button size="sm" variant="gradient-secondary">
                            Withdraw Funds
                          </Button>
                        </Link>
                      )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="donations">
          <Card>
            <CardHeader>
              <CardTitle>My Donations</CardTitle>
              <CardDescription>
                A record of all your contributions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {donations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    You haven't made any donations yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {donations.map((donation) => (
                    <div
                      key={donation.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <div className="font-medium">
                          {donation.fundraiser.event.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Donated on{" "}
                          {new Date(donation.dateAdded).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="font-medium text-primary-600">
                        ${Number(donation.amount).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="withdrawals">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>
                A record of all your withdrawals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {withdrawals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No withdrawals yet.</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {withdrawals.map((withdrawal) => (
                    <div
                      key={withdrawal.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0"
                    >
                      <div>
                        <div className="font-medium">
                          {withdrawal.fundraiser.event.title}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Withdrawn on{" "}
                          {new Date(withdrawal.dateAdded).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="space-y-1 text-right">
                        <div className="font-medium text-primary-600">
                          ${Number(withdrawal.amount).toLocaleString()}
                        </div>
                        <div
                          className={`text-xs px-2 py-1 rounded-full inline-block ${
                            withdrawal.status === "COMPLETED"
                              ? "bg-green-100 text-green-800"
                              : withdrawal.status === "PENDING"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {withdrawal.status.toLowerCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
