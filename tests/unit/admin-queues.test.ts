import { describe, expect, it } from "vitest";
import { parseAdminQueueParams } from "@/schemas/admin";

describe("parseAdminQueueParams", () => {
  it("defaults to the pending verification queue", () => {
    expect(parseAdminQueueParams({})).toMatchObject({
      tab: "verifications",
      verificationStatus: "PENDING",
      reportStatus: "OPEN",
      campaignStatus: "all",
      banned: "all",
      page: 1,
    });
  });

  it("parses a selected queue and filters from URL parameters", () => {
    expect(
      parseAdminQueueParams({
        tab: "users",
        q: "  ama@example.com ",
        verificationStatus: "VERIFIED",
        banned: "banned",
        page: "2",
      }),
    ).toMatchObject({
      tab: "users",
      q: "ama@example.com",
      verificationStatus: "VERIFIED",
      banned: "banned",
      page: 2,
    });
  });

  it("ignores malformed values and bounds the search query", () => {
    const parsed = parseAdminQueueParams({
      tab: "unknown",
      q: ` ${"a".repeat(120)} `,
      reportStatus: "invalid",
      campaignStatus: "invalid",
      page: "-1",
    });

    expect(parsed.tab).toBe("verifications");
    expect(parsed.q).toHaveLength(100);
    expect(parsed.reportStatus).toBe("OPEN");
    expect(parsed.campaignStatus).toBe("all");
    expect(parsed.page).toBe(1);
  });
});
