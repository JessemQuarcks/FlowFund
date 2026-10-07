import { describe, expect, it } from "vitest";
import { parseDiscoverParams } from "@/schemas/discover";
import {
  buildDiscoverOrderBy,
  buildDiscoverWhere,
} from "@/lib/services/events";

describe("parseDiscoverParams", () => {
  it("applies defaults for an empty query", () => {
    expect(parseDiscoverParams({})).toEqual({
      q: undefined,
      category: undefined,
      sort: "trending",
      min: undefined,
      max: undefined,
      page: 1,
    });
  });

  it("keeps valid values and takes the first of an array", () => {
    const parsed = parseDiscoverParams({
      q: "  beach  ",
      category: "MEDICAL",
      sort: ["newest", "trending"],
      min: "100",
      max: "5000",
      page: "3",
    });
    expect(parsed).toEqual({
      q: "beach",
      category: "MEDICAL",
      sort: "newest",
      min: 100,
      max: 5000,
      page: 3,
    });
  });

  it("ignores malformed values instead of throwing", () => {
    const parsed = parseDiscoverParams({
      category: "CRYPTO",
      sort: "cheapest",
      min: "-5",
      max: "abc",
      page: "0",
    });
    expect(parsed.category).toBeUndefined();
    expect(parsed.sort).toBe("trending");
    expect(parsed.min).toBeUndefined();
    expect(parsed.max).toBeUndefined();
    expect(parsed.page).toBe(1);
  });
});

describe("buildDiscoverWhere", () => {
  const base = { sort: "trending" as const, page: 1 };

  it("is empty with no filters", () => {
    expect(buildDiscoverWhere(base)).toEqual({});
  });

  it("searches title and description", () => {
    expect(buildDiscoverWhere({ ...base, q: "school" })).toEqual({
      AND: [
        {
          OR: [
            { title: { contains: "school" } },
            { description: { contains: "school" } },
          ],
        },
      ],
    });
  });

  it("converts the goal range from GHS to pesewas and requires a fundraiser", () => {
    const where = buildDiscoverWhere({ ...base, min: 100, max: 5000 });
    expect(where.AND).toContainEqual({
      fundraiser: { is: { targetAmount: { gte: 10_000, lte: 500_000 } } },
    });
  });
});

describe("buildDiscoverOrderBy", () => {
  it("maps each sort option", () => {
    expect(buildDiscoverOrderBy("newest")).toEqual({ dateAdded: "desc" });
    expect(buildDiscoverOrderBy("most-funded")).toEqual({
      fundraiser: { raisedAmount: "desc" },
    });
    expect(buildDiscoverOrderBy("ending-soon")).toEqual({
      fundraiser: { endDate: "asc" },
    });
    expect(buildDiscoverOrderBy("trending")).toEqual({
      fundraiser: { donorCount: "desc" },
    });
  });
});
