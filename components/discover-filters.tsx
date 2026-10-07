"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";
import type { DiscoverParams } from "@/schemas/discover";

const CATEGORIES = [
  ["all", "All Categories"],
  ["COMMUNITY", "Community"],
  ["EDUCATIONAL", "Education"],
  ["MEDICAL", "Medical"],
  ["EMERGENCY", "Emergency"],
  ["ANIMALS", "Animals"],
  ["ENVIRONMENT", "Environment"],
  ["NONPROFIT", "Nonprofit"],
  ["OTHER", "Other"],
] as const;

const SORTS = [
  ["trending", "Trending"],
  ["newest", "Newest"],
  ["most-funded", "Most Funded"],
  ["ending-soon", "Ending Soon"],
] as const;

// Drives the discover query entirely through the URL, so results are
// shareable and server-rendered. Applying a filter resets to page 1.
export function DiscoverFilters({ current }: { current: DiscoverParams }) {
  const router = useRouter();
  const [q, setQ] = useState(current.q ?? "");
  const [category, setCategory] = useState<string>(current.category ?? "all");
  const [sort, setSort] = useState<string>(current.sort);
  const [min, setMin] = useState(current.min?.toString() ?? "");
  const [max, setMax] = useState(current.max?.toString() ?? "");

  const apply = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category && category !== "all") params.set("category", category);
    if (sort) params.set("sort", sort);
    if (min.trim()) params.set("min", min.trim());
    if (max.trim()) params.set("max", max.trim());
    // Any filter change starts back at the first page.
    router.push(`/events?${params.toString()}`);
  };

  const onSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") apply();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search fundraisers..."
              className="pl-8"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={onSearchKeyDown}
            />
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
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger>
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                {SORTS.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Goal Amount (GH₵)</label>
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Min"
                min="0"
                value={min}
                onChange={(e) => setMin(e.target.value)}
              />
              <Input
                type="number"
                placeholder="Max"
                min="0"
                value={max}
                onChange={(e) => setMax(e.target.value)}
              />
            </div>
          </div>

          <Button className="w-full" variant="outline" onClick={apply}>
            <Filter className="mr-2 h-4 w-4" />
            Apply Filters
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
