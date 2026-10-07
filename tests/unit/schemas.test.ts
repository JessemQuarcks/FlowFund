import { describe, expect, it } from "vitest";
import { signupSchema } from "@/schemas/auth";
import { createEventSchema } from "@/schemas/event";

describe("signupSchema", () => {
  const valid = { name: "Ama", email: "ama@example.com", password: "secret1!" };

  it("accepts a valid signup and trims fields", () => {
    expect(
      signupSchema.parse({
        ...valid,
        name: "  Ama ",
        email: " ama@example.com",
      }),
    ).toEqual(valid);
  });

  it.each([
    ["short1!", "at least 8 characters"],
    ["nodigits!", "include a number"],
    ["nospecial1", "include a special character"],
    [`${"a".repeat(71)}1!`, "at most 72 characters"],
  ])("rejects password %j", (password, message) => {
    const result = signupSchema.safeParse({ ...valid, password });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(message);
  });

  it("rejects an invalid email", () => {
    expect(signupSchema.safeParse({ ...valid, email: "nope" }).success).toBe(
      false,
    );
  });
});

describe("createEventSchema", () => {
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const form = (overrides: Record<string, string> = {}) => {
    const data = new FormData();
    const fields = {
      "event.title": "Clean-up day",
      "event.description": "Clearing the beach",
      "event.category": "COMMUNITY",
      "event.date": future,
      "fundraiser.targetAmount": "1000",
      "fundraiser.minimumAmount": "5",
      "fundraiser.endDate": future,
      ...overrides,
    };
    for (const [key, value] of Object.entries(fields)) data.append(key, value);
    return data;
  };

  it("parses a valid form and converts money to pesewas", () => {
    const parsed = createEventSchema.parse(form());
    expect(parsed.event.title).toBe("Clean-up day");
    // 1000 GHS and 5 GHS are stored as integer pesewas.
    expect(parsed.fundraiser.targetAmount).toBe(100_000);
    expect(parsed.fundraiser.minimumAmount).toBe(500);
    expect(parsed.fundraiser.anonymity).toBe(false);
  });

  it("rejects an end date in the past", () => {
    const result = createEventSchema.safeParse(
      form({ "fundraiser.endDate": "2000-01-01" }),
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unknown category", () => {
    const result = createEventSchema.safeParse(
      form({ "event.category": "CRYPTO" }),
    );
    expect(result.success).toBe(false);
  });
});
