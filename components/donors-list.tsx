"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/money";

type Donor = {
  id: string;
  name: string;
  amount: number;
  currency: string;
  date: string;
};

type Sort = "recent" | "highest" | "lowest";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (
    (parts[0]?.[0] ?? "") + (parts.length > 1 ? (parts[1][0] ?? "") : "")
  ).toUpperCase();
}

function relativeDate(iso: string) {
  return new Date(iso).toLocaleDateString();
}

export function DonorsList({ eventId }: { eventId: string }) {
  const [sortBy, setSortBy] = useState<Sort>("recent");
  const [page, setPage] = useState(1);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/events/${eventId}/donors?sort=${sortBy}&page=${page}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!active || !body) return;
        setDonors(body.donors ?? []);
        setTotalPages(body.totalPages ?? 1);
        setTotal(body.total ?? 0);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [eventId, sortBy, page]);

  const changeSort = (value: string) => {
    setSortBy(value as Sort);
    setPage(1);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Donors</CardTitle>
          <CardDescription>
            {total === 0
              ? "People who have supported this fundraiser"
              : `${total} ${total === 1 ? "donation" : "donations"}`}
          </CardDescription>
        </div>
        <Select value={sortBy} onValueChange={changeSort}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Most Recent</SelectItem>
            <SelectItem value="highest">Highest Amount</SelectItem>
            <SelectItem value="lowest">Lowest Amount</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Loading donors…
          </p>
        ) : donors.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No donations yet. Be the first to give!
          </p>
        ) : (
          <>
            <div className="space-y-4">
              {donors.map((donor) => (
                <div
                  key={donor.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {donor.name === "Anonymous"
                          ? "?"
                          : initials(donor.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{donor.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {relativeDate(donor.date)}
                      </div>
                    </div>
                  </div>
                  <div className="font-medium text-primary-600">
                    {formatMoney(donor.amount, donor.currency)}
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
