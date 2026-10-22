import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AdminTab } from "@/schemas/admin";

export type QueueFilter = {
  label: string;
  name: string;
  value: string;
  options: { label: string; value: string }[];
};

type QueueSelection = Pick<QueueFilter, "name" | "value">;

function queueHref(
  tab: AdminTab,
  page: number,
  q: string | undefined,
  filters: QueueSelection[],
) {
  const params = new URLSearchParams({ tab, page: String(page) });
  if (q) params.set("q", q);
  for (const filter of filters) {
    if (filter.value && filter.value !== "all") {
      params.set(filter.name, filter.value);
    }
  }
  return `/admin?${params.toString()}`;
}

export function AdminQueueFilters({
  tab,
  q,
  filters,
}: {
  tab: AdminTab;
  q?: string;
  filters: QueueFilter[];
}) {
  return (
    <form
      action="/admin"
      method="get"
      className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-end"
    >
      <input type="hidden" name="tab" value={tab} />
      <div className="min-w-48 flex-1 space-y-1.5">
        <label htmlFor={`${tab}-search`} className="text-sm font-medium">
          Search
        </label>
        <Input
          id={`${tab}-search`}
          type="search"
          name="q"
          maxLength={100}
          placeholder="Search name, email, or title..."
          defaultValue={q}
        />
      </div>
      {filters.map((filter) => (
        <div key={filter.name} className="min-w-44 space-y-1.5">
          <label
            htmlFor={`${tab}-${filter.name}`}
            className="text-sm font-medium"
          >
            {filter.label}
          </label>
          <select
            id={`${tab}-${filter.name}`}
            name={filter.name}
            defaultValue={filter.value}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Button type="submit">Apply</Button>
        <Link href={`/admin?tab=${tab}`}>
          <Button type="button" variant="outline">
            Clear
          </Button>
        </Link>
      </div>
    </form>
  );
}

export function AdminQueuePagination({
  tab,
  q,
  filters,
  page,
  total,
  totalPages,
  perPage,
}: {
  tab: AdminTab;
  q?: string;
  filters: QueueSelection[];
  page: number;
  total: number;
  totalPages: number;
  perPage: number;
}) {
  const firstResult = total === 0 ? 0 : (page - 1) * perPage + 1;
  const lastResult = Math.min(page * perPage, total);

  return (
    <div className="mt-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground" aria-live="polite">
        Showing {firstResult}–{lastResult} of {total}
      </p>
      {totalPages > 1 && (
        <nav
          aria-label={`${tab} queue pagination`}
          className="flex items-center gap-3"
        >
          {page > 1 ? (
            <Link
              href={queueHref(tab, page - 1, q, filters)}
              aria-label="Previous page"
            >
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
            <Link
              href={queueHref(tab, page + 1, q, filters)}
              aria-label="Next page"
            >
              <Button variant="outline">Next</Button>
            </Link>
          ) : (
            <Button variant="outline" disabled>
              Next
            </Button>
          )}
        </nav>
      )}
    </div>
  );
}
