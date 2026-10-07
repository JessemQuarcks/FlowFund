import { z } from "zod";
import { Event_Category } from "@/lib/generated/prisma";

export const EVENTS_PER_PAGE = 9;

export const SORT_OPTIONS = [
  "trending",
  "newest",
  "most-funded",
  "ending-soon",
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];

// Raw search params (strings, possibly arrays or missing) as Next provides
// them. Takes the first value of each.
export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export type DiscoverParams = {
  q?: string;
  category?: Event_Category;
  sort: SortOption;
  min?: number; // GHS
  max?: number; // GHS
  page: number;
};

const positiveNumber = (value: string | undefined): number | undefined => {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

// Parses the discover query string into typed filters, tolerating anything
// malformed (a bad value is simply ignored rather than throwing).
export function parseDiscoverParams(raw: RawSearchParams): DiscoverParams {
  const categoryRaw = first(raw.category);
  const category =
    categoryRaw && categoryRaw in Event_Category
      ? (categoryRaw as Event_Category)
      : undefined;

  const sortRaw = first(raw.sort) as SortOption | undefined;
  const sort = sortRaw && SORT_OPTIONS.includes(sortRaw) ? sortRaw : "trending";

  const pageRaw = Number(first(raw.page));
  const page = Number.isInteger(pageRaw) && pageRaw >= 1 ? pageRaw : 1;

  const q = first(raw.q)?.trim();

  return {
    q: q ? q.slice(0, 100) : undefined,
    category,
    sort,
    min: positiveNumber(first(raw.min)),
    max: positiveNumber(first(raw.max)),
    page,
  };
}

// A zod schema mirroring the same shape, for anywhere that prefers validation
// with issues (kept in sync with parseDiscoverParams).
export const discoverParamsSchema = z.object({
  q: z.string().trim().max(100).optional(),
  category: z.nativeEnum(Event_Category).optional(),
  sort: z.enum(SORT_OPTIONS).default("trending"),
  min: z.number().min(0).optional(),
  max: z.number().min(0).optional(),
  page: z.number().int().min(1).default(1),
});
