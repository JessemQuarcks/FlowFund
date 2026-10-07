import { describe, expect, it } from "vitest";
import {
  formatGHS,
  formatMoney,
  toMajorUnits,
  toMinorUnits,
} from "@/lib/money";

describe("toMinorUnits", () => {
  it("converts GHS to pesewas and rounds to the nearest pesewa", () => {
    expect(toMinorUnits(50)).toBe(5_000);
    expect(toMinorUnits(5)).toBe(500);
    expect(toMinorUnits(12.34)).toBe(1_234);
    expect(toMinorUnits(0.1)).toBe(10);
    // Floating-point representation must not leak through.
    expect(toMinorUnits(19.99)).toBe(1_999);
  });

  it("rejects values that are not finite numbers", () => {
    expect(() => toMinorUnits(NaN)).toThrow();
    expect(() => toMinorUnits(Infinity)).toThrow();
  });
});

describe("toMajorUnits", () => {
  it("converts pesewas back to GHS", () => {
    expect(toMajorUnits(5_000)).toBe(50);
    expect(toMajorUnits(10)).toBe(0.1);
  });
});

describe("formatMoney", () => {
  it("formats pesewas as GHS currency", () => {
    expect(formatGHS(5_000)).toContain("50.00");
    expect(formatGHS(0)).toContain("0.00");
    // The GHS symbol or code is present.
    expect(formatGHS(5_000)).toMatch(/GH₵|GHS/);
  });

  it("honours a non-GHS currency", () => {
    expect(formatMoney(5_000, "NGN")).toMatch(/50\.00/);
  });
});
