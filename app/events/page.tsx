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
import { Users, Clock } from "lucide-react";
import { searchEvents } from "@/lib/services/events";
import { formatMoney } from "@/lib/money";
import { parseDiscoverParams, type RawSearchParams } from "@/schemas/discover";
import { DiscoverFilters } from "@/components/discover-filters";

const CATEGORY_LABELS: Record<string, string> = {
  COMMUNITY: "Community",
  EDUCATIONAL: "Education",
  ENVIRONMENT: "Environment",
  MEDICAL: "Medical",
  NONPROFIT: "Nonprofit",
  EMERGENCY: "Emergency",
  ANIMALS: "Animals",
  OTHER: "Other",
};

function daysLeft(endDate: Date | null) {
  if (!endDate) return 0;
  return Math.max(
    0,
    Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );
}

// Preserves the current filters while changing the page.
function pageHref(
  params: ReturnType<typeof parseDiscoverParams>,
  page: number,
) {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.category) sp.set("category", params.category);
  if (params.sort) sp.set("sort", params.sort);
  if (params.min !== undefined) sp.set("min", String(params.min));
  if (params.max !== undefined) sp.set("max", String(params.max));
  sp.set("page", String(page));
  return `/events?${sp.toString()}`;
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseDiscoverParams(await searchParams);
  const { events, page, totalPages, total } = await searchEvents(params);

  return (
    <div className="container py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Discover Fundraisers</h1>
          <p className="text-muted-foreground mt-1">
            Find and support causes that matter to you
          </p>
        </div>
        <Link href="/events/create">
          <Button>Start a Fundraiser</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-[250px_1fr]">
        <DiscoverFilters current={params} />

        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  No fundraisers match your search.
                </p>
                <Link href="/events" className="mt-4 inline-block">
                  <Button variant="outline">Clear filters</Button>
                </Link>
              </div>
            ) : (
              events.map((event) => (
                <Card key={event.id} className="overflow-hidden">
                  <img
                    src={
                      event.fundraiser?.image ||
                      "/placeholder.svg?height=200&width=400"
                    }
                    alt={event.title}
                    className="aspect-video w-full object-cover"
                    width={400}
                    height={200}
                  />
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                        {CATEGORY_LABELS[event.category] ?? event.category}
                      </span>
                    </div>
                    <CardTitle className="line-clamp-1">
                      {event.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {event.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {event.fundraiser ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>
                              {formatMoney(
                                event.fundraiser.raisedAmount,
                                event.fundraiser.currency,
                              )}{" "}
                              raised of{" "}
                              {formatMoney(
                                event.fundraiser.targetAmount,
                                event.fundraiser.currency,
                              )}
                            </span>
                            <span className="font-medium text-primary-600">
                              {Math.round(
                                (event.fundraiser.raisedAmount /
                                  event.fundraiser.targetAmount) *
                                  100,
                              )}
                              %
                            </span>
                          </div>
                          <Progress
                            value={
                              (event.fundraiser.raisedAmount /
                                event.fundraiser.targetAmount) *
                              100
                            }
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
                            <span>
                              {daysLeft(event.fundraiser.endDate)} days left
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        <p>Event details only - no fundraising component</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Link href={`/events/${event.id}`} className="w-full">
                      <Button className="w-full">
                        {event.fundraiser ? "Donate Now" : "View Event"}
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4">
              {page > 1 ? (
                <Link href={pageHref(params, page - 1)}>
                  <Button variant="outline">Previous</Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  Previous
                </Button>
              )}
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {total} fundraisers
              </span>
              {page < totalPages ? (
                <Link href={pageHref(params, page + 1)}>
                  <Button variant="outline">Next</Button>
                </Link>
              ) : (
                <Button variant="outline" disabled>
                  Next
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
