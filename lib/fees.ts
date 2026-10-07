// Platform economics. The platform keeps a percentage of the money raised;
// the rest is what an organiser can withdraw. All amounts are integer pesewas.

export const PLATFORM_FEE_RATE = 0.05; // 5% of the money raised

// The platform's cut of a raised total, rounded to the nearest pesewa.
export function platformFee(raised: number): number {
  return Math.round(raised * PLATFORM_FEE_RATE);
}

// What is left for the organiser after the platform fee.
export function netRaised(raised: number): number {
  return raised - platformFee(raised);
}

// How much an organiser can still withdraw: the net of fees, less what has
// already been withdrawn or reserved. Never negative.
export function availableToWithdraw(
  raised: number,
  totalWithdrawn: number,
): number {
  return Math.max(0, netRaised(raised) - totalWithdrawn);
}
