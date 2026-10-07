import { describe, expect, it } from "vitest";
import {
  PLATFORM_FEE_RATE,
  availableToWithdraw,
  netRaised,
  platformFee,
} from "@/lib/fees";

describe("platform fees", () => {
  it("charges 5%", () => {
    expect(PLATFORM_FEE_RATE).toBe(0.05);
    expect(platformFee(10_000)).toBe(500);
    expect(netRaised(10_000)).toBe(9_500);
  });

  it("rounds the fee to the nearest pesewa", () => {
    expect(platformFee(9_999)).toBe(500); // 499.95 -> 500
    expect(platformFee(1_010)).toBe(51); // 50.5 -> 51
  });

  it("available is net of fees less what is already withdrawn", () => {
    expect(availableToWithdraw(10_000, 0)).toBe(9_500);
    expect(availableToWithdraw(10_000, 4_000)).toBe(5_500);
    expect(availableToWithdraw(10_000, 9_500)).toBe(0);
  });

  it("never goes negative", () => {
    expect(availableToWithdraw(0, 0)).toBe(0);
    expect(availableToWithdraw(10_000, 20_000)).toBe(0);
  });
});
