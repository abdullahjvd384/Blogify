/**
 * Format an integer amount of USD cents as a currency string, e.g. 500 → "$5.00".
 * Whole-dollar amounts drop the cents ("$50"), otherwise two decimals are shown.
 * (Amounts are stored as integer minor units; legacy code/fields call them
 * "paisa" but the unit is USD cents.)
 */
export function usd(cents) {
  const value = (Number(cents) || 0) / 100;
  const fractionDigits = Number.isInteger(value) ? 0 : 2;
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: 2,
  });
}
