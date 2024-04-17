import { DateTime } from 'luxon';
import { DefaultValidity } from 'luxon/src/_util';
import { is } from '../../extensions';

function notSame(range: DateRange): boolean {
  return range.from.valueOf() !== range.to.valueOf();
}

export interface DateRange<IsValid extends boolean = DefaultValidity> {
  from: DateTime<IsValid>;
  to: DateTime<IsValid>;
}

export namespace DateRange {

  export type DateRangeCompareResult = 'before' | 'after' | 'adjacentBefore' | 'adjacentAfter' | 'overlapsAtStart' | 'overlapsAtEnd' | 'contains' | 'containedBy' | 'same';

  export function compare(range1: DateRange, range2: DateRange): DateRangeCompareResult {
    if (range1.to < range2.from) return 'before';
    if (range1.from > range2.to) return 'after';
    if (range1.to.equals(range2.from)) return 'adjacentBefore';
    if (range1.from.equals(range2.to)) return 'adjacentAfter';
    if ((range1.from <= range2.from && range1.to > range2.to) || (range1.from < range2.from && range1.to >= range2.to)) return 'contains';
    if ((range1.from >= range2.from && range1.to < range2.to) || (range1.from > range2.from && range1.to <= range2.to)) return 'containedBy';
    if (range1.from < range2.from) return 'overlapsAtStart';
    if (range1.to > range2.to) return 'overlapsAtEnd';
    return 'same';
  }

  interface FilterToOptions {
    edgeRanges?: 'clip' | 'include' | 'exclude';
  }

  export function filterTo({ from, to }: DateRange, ranges: DateRange[], { edgeRanges = 'include' }: FilterToOptions = {}): DateRange[] {
    return ranges
      .map(range => {
        const result = compare({ from, to }, range);
        if (result === 'before' || result === 'after' || result === 'adjacentBefore' || result === 'adjacentAfter') return null;
        switch (edgeRanges) {
          case 'include': return range;
          case 'exclude': {
            switch (result) {
              case 'contains': case 'same': return range;
            }
            return;
          }
          case 'clip': {
            switch (result) {
              case 'contains': case 'same': return range;
              case 'containedBy': return { from, to };
              case 'overlapsAtStart': return { from: range.from, to };
              case 'overlapsAtEnd': return { from, to: range.to };
            }
          }
        }
      })
      .removeNull()
      .filter(notSame);
  }

  export function merge(ranges: DateRange[]): DateRange[] {
    const mergedRanges: DateRange[] = [];
    ranges.forEach(range => {
      if (mergedRanges.length === 0) {
        mergedRanges.push(range);
      } else {
        let rangeUsed = false;
        mergedRanges.forEach(merged => {
          const result = compare(range, merged);
          switch (result) {
            case 'before': case 'after': return;
            case 'same': case 'containedBy': { rangeUsed = true; return; }
            case 'contains': { merged.from = range.from; merged.to = range.to; rangeUsed = true; return; }
            case 'overlapsAtStart': case 'adjacentBefore': { merged.from = range.from; rangeUsed = true; return; }
            case 'overlapsAtEnd': case 'adjacentAfter': { merged.to = range.to; rangeUsed = true; return; }
          }
        });
        if (!rangeUsed) mergedRanges.push(range);
      }
    });
    return mergedRanges.filter(notSame);
  }

  export function sort(ranges: DateRange[]): DateRange[] {
    return ranges.slice().sort((a, b) => a.from.toMillis() - b.from.toMillis());
  }

  export function findOverlaps(ranges: DateRange[]): DateRange[];
  export function findOverlaps(ranges: DateRange[][]): DateRange[];
  export function findOverlaps(ranges: DateRange[] | DateRange[][]): DateRange[] {
    if (ranges.length === 0) return [];
    if (is.array(ranges[0])) {
      let overlaps = merge(ranges[0]);
      if (ranges.length === 1) return overlaps;
      ranges.slice(1).forEach(innerRanges => {
        if (!is.array(innerRanges)) return;
        const mergedInnerRanges = merge(innerRanges);
        const newOverlaps: DateRange[] = [];
        overlaps.forEach(overlap => {
          const result = filterTo(overlap, mergedInnerRanges, { edgeRanges: 'clip' });
          newOverlaps.push(...result);
        });
        overlaps = merge(newOverlaps);
      });
      return overlaps.filter(notSame);
    } else {
      return findOverlaps((ranges as DateRange[]).map(range => [range]));
    }
  }

  export function findGaps(ranges: DateRange[]): DateRange[];
  export function findGaps(range: DateRange, ranges: DateRange[]): DateRange[];
  export function findGaps(rangeOrRanges: DateRange | DateRange[], ranges?: DateRange[]): DateRange[] {
    if (!is.array(ranges)) {
      ranges = rangeOrRanges as DateRange[];
      const sortedRanges = sort(merge(ranges));
      const gaps: DateRange[] = [];
      sortedRanges.forEach((range, index) => {
        if (index === 0) return;
        const previousRange = sortedRanges[index - 1];
        if (previousRange.to < range.from) gaps.push({ from: previousRange.to, to: range.from });
      });
      return gaps;
    } else {
      const range = rangeOrRanges as DateRange;
      return findGaps([{ from: range.from.minus({ minutes: 1 }), to: range.from }, ...ranges, { from: range.to, to: range.to.plus({ minutes: 1 }) }]);
    }
  }

  export function isWithin(range: DateRange, date: DateTime): boolean {
    return range.from <= date && range.to >= date;
  }
}