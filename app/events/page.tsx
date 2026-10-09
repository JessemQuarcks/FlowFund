import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/reveal";
import {
  CampaignCard,
  type CampaignCardData,
} from "@/components/campaign-card";
import { searchEvents } from "@/lib/services/events";
import { parseDiscoverParams, type RawSearchParams } from "@/schemas/discover";
import { DiscoverFilters } from "@/components/discover-filters";
import { SearchX } from "lucide-react";

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

export const metadata = {
  title: "Discover fundraisers",
  description: "Find and support causes that matter to you across Ghana.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseDiscoverParams(await searchParams);
  const { events, page, totalPages, total } = await searchEvents(params);

  const cards: CampaignCardData[] = events
    .filter((e) => e.fundraiser)
    .map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      category: e.category,
      image: e.fundraiser!.image,
      raisedAmount: e.fundraiser!.raisedAmount,
      targetAmount: e.fundraiser!.targetAmount,
      currency: e.fundraiser!.currency,
      donorCount: e.fundraiser!.donorCount,
      endDate: e.fundraiser!.endDate,
      organiserName: e.user?.name,
      verified: e.user?.isVerifiedOrganiser,
    }));

  return (
    <div className="bg-grid">
      {/* Header band */}
      <div className="border-b bg-background/60">
        <div className="container flex flex-col gap-4 py-10 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Discover <span className="brand-text-gradient">fundraisers</span>
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
              {total} {total === 1 ? "campaign" : "campaigns"} raising money for
              causes across Ghana.
            </p>
          </div>
          <Link href="/events/create">
            <Button variant="gradient">Start a fundraiser</Button>
          </Link>
        </div>
      </div>

      <div className="container py-8">
        <div className="grid gap-8 md:grid-cols-[260px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start">
            <DiscoverFilters current={params} />
          </aside>

          <div className="space-y-8">
            {cards.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border bg-card py-20 text-center shadow-soft">
                <SearchX className="h-10 w-10 text-muted-foreground" />
                <p className="mt-4 text-lg font-medium">No campaigns found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your filters or search.
                </p>
                <Link href="/events" className="mt-5">
                  <Button variant="outline">Clear filters</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {cards.map((c, i) => (
                  <Reveal key={c.id} delay={(i % 3) * 80}>
                    <CampaignCard campaign={c} />
                  </Reveal>
                ))}
              </div>
            )}

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
                  Page {page} of {totalPages}
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
    </div>
  );
}
