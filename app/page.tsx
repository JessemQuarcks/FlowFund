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
import { MoveRight, TrendingUp, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { EventWithDaysLeft } from "@/types";
// import { EventWithDaysLeft } from "@/types";

export default async function Home() {
  // Await the database query to get the actual array
  const featuredEvents = await prisma.event.findMany({
    include: {
      fundraiser: true,
    },
  });

  const events: EventWithDaysLeft[] = featuredEvents.map((e) => ({
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

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 hero-pattern">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="space-y-4">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                  <span className="green-text-gradient">Raise funds</span> for
                  what matters to you
                </h1>
                <p className="max-w-[600px] text-muted-foreground md:text-xl">
                  Create fundraising events, set targets, and track donations in
                  real-time. Make a difference with FundFlow.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/events/create">
                    <Button size="lg" className="gap-1" variant="gradient">
                      Start Fundraising <MoveRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button variant="outline" size="lg">
                      Explore Events
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-1 rounded-xl bg-green-gradient blur-xl opacity-30"></div>
                <img
                  src="/placeholder.svg?height=400&width=600"
                  alt="Fundraising illustration"
                  className="relative mx-auto aspect-video overflow-hidden rounded-xl object-cover"
                  width={600}
                  height={400}
                />
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  <span className="green-text-gradient">Featured</span>{" "}
                  Fundraisers
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Discover events that are making a difference in communities
                  around the world.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3">
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
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>
                            ${event.fundraiser?.raisedAmount.toLocaleString()}{" "}
                            raised of $
                            {event.fundraiser?.targetAmount.toLocaleString()}
                          </span>
                          <span className="font-medium text-primary-600">
                            {event.fundraiser
                              ? Math.round(
                                  (Number(event.fundraiser.raisedAmount) /
                                    Number(event.fundraiser.targetAmount)) *
                                    100
                                )
                              : 0}
                            %
                          </span>
                        </div>
                        <Progress
                          value={
                            event.fundraiser
                              ? (Number(event.fundraiser.raisedAmount) /
                                  Number(event.fundraiser.targetAmount)) *
                                100
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          <span>
                            {event.fundraiser?.donorCount || 0} donors
                          </span>
                        </div>
                        <div>{`${event.daysLeft} days left`}</div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href={`/events/${event.id}`} className="w-full">
                      <Button className="w-full" variant="gradient-secondary">
                        Donate Now
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
            <div className="flex justify-center">
              <Link href="/events">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                >
                  View All Events
                </Button>
              </Link>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <img
                src="/placeholder.svg?height=400&width=600"
                alt="How it works illustration"
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
                width={600}
                height={400}
              />
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    How <span className="green-text-gradient">FundFlow</span>{" "}
                    Works
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Our platform makes fundraising simple, transparent, and
                    effective.
                  </p>
                </div>
                <ul className="grid gap-6">
                  <li className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-gradient text-white">
                      1
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">Create Your Event</h3>
                      <p className="text-muted-foreground">
                        Set up your fundraising event with details, target
                        amount, and a compelling story.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-gradient text-white">
                      2
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">
                        Share With Your Network
                      </h3>
                      <p className="text-muted-foreground">
                        Spread the word about your cause through social media
                        and direct sharing.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-gradient text-white">
                      3
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">Collect Donations</h3>
                      <p className="text-muted-foreground">
                        Receive funds securely with options for anonymous or
                        visible donor recognition.
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-4">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-gradient text-white">
                      4
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">Withdraw Funds</h3>
                      <p className="text-muted-foreground">
                        Access your raised funds easily when you need them for
                        your event or cause.
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 bg-primary-50 dark:bg-primary-950">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-primary-600" />
            <span className="text-xl font-bold green-text-gradient">
              FundFlow
            </span>
          </div>
          <p className="text-center text-sm text-muted-foreground md:text-left">
            © {new Date().getFullYear()} FundFlow. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-primary-600 hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-primary-600 hover:underline"
            >
              Privacy
            </Link>
            <Link
              href="/contact"
              className="text-sm text-muted-foreground hover:text-primary-600 hover:underline"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}