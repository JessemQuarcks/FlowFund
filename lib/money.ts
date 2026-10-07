// Money is stored and passed around as an integer number of the currency's
// minor unit (pesewas for GHS: 1 GHS = 100 pesewas). These helpers convert at
// the edges (forms in, display out); nothing else should divide or multiply
// money by 100.

export const MINOR_UNITS_PER_MAJOR = 100;

// A whole number of pesewas. Rejects fractions, infinities and NaN so a bad
// value never reaches the database.
export function toMinorUnits(major: number): number {
  if (!Number.isFinite(major)) {
    throw new Error(`Not a finite amount: ${major}`);
  }
  return Math.round(major * MINOR_UNITS_PER_MAJOR);
}

export function toMajorUnits(minor: number): number {
  return minor / MINOR_UNITS_PER_MAJOR;
}

const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(currency: string): Intl.NumberFormat {
  let formatter = formatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GH", {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    });
    formatters.set(currency, formatter);
  }
  return formatter;
}

// Formats an integer minor-unit amount as currency, e.g. 5000 -> "GH₵50.00".
// Defaults to GHS; pass a fundraiser/donation's currency for other markets.
export function formatMoney(minor: number, currency = "GHS"): string {
  return formatterFor(currency).format(toMajorUnits(minor));
}

// Convenience wrapper for the common GHS case.
export function formatGHS(pesewas: number): string {
  return formatMoney(pesewas, "GHS");
}
