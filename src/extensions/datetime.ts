import { DateTime } from 'luxon';

/**
 * True when both values are valid Luxon DateTimes for the same instant (epoch ms).
 * Ignores zone and locale — use {@link DateTime#equals} when those must match too.
 */
export function sameInstant(a: DateTime, b: DateTime): boolean {
  return a.isValid && b.isValid && a.valueOf() === b.valueOf();
}
