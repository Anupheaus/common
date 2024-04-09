import { DateTime } from 'luxon';
import { DateRange } from './date';

const createRange = (from: number, to: number): DateRange => ({
  from: DateTime.fromISO(`2021-01-01T${from.toString().padStart(2, '0')}:00:00.000Z`),
  to: DateTime.fromISO(`2021-01-01T${to.toString().padStart(2, '0')}:00:00.000Z`),
});

describe('date', () => {

  describe('DateRange', () => {

    describe('compare', () => {
      it('can compare two ranges that are the same', () => {
        expect(DateRange.compare(createRange(20, 21), createRange(20, 21))).to.eql('same');
      });

      it('can compare two ranges that are before', () => {
        expect(DateRange.compare(createRange(18, 19), createRange(20, 21))).to.eql('before');
      });

      it('can compare two ranges that are after', () => {
        expect(DateRange.compare(createRange(22, 23), createRange(20, 21))).to.eql('after');
      });

      it('can compare two ranges that are contains', () => {
        expect(DateRange.compare(createRange(19, 23), createRange(20, 21))).to.eql('contains');
        expect(DateRange.compare(createRange(19, 23), createRange(20, 23))).to.eql('contains');
        expect(DateRange.compare(createRange(19, 23), createRange(19, 21))).to.eql('contains');
      });

      it('can compare two ranges that are contained by', () => {
        expect(DateRange.compare(createRange(20, 21), createRange(19, 22))).to.eql('containedBy');
      });

      it('can compare two ranges that are overlapping at the end', () => {
        expect(DateRange.compare(createRange(20, 23), createRange(19, 22))).to.eql('overlapsAtEnd');
      });

      it('can compare two ranges that are overlapping at the start', () => {
        expect(DateRange.compare(createRange(18, 21), createRange(19, 22))).to.eql('overlapsAtStart');
      });

    });

    describe('filterTo', () => {

      const createRanges = () => {
        const range: DateRange = createRange(9, 17);
        const ranges: DateRange[] = [
          createRange(8, 10),
          createRange(8, 11),
          createRange(9, 10),
          createRange(11, 13),
          createRange(15, 18),
          createRange(16, 17),
          createRange(20, 22),
          createRange(6, 22),
        ];
        return { range, ranges };
      };

      it('can filter ranges to between a certain range (include)', () => {
        const { range, ranges } = createRanges();
        expect(DateRange.filterTo(range, ranges, { edgeRanges: 'include' })).to.eql([
          createRange(8, 10),
          createRange(8, 11),
          createRange(9, 10),
          createRange(11, 13),
          createRange(15, 18),
          createRange(16, 17),
          createRange(6, 22),
        ]);
      });

      it('can filter ranges to between a certain range (exclude)', () => {
        const { range, ranges } = createRanges();
        expect(DateRange.filterTo(range, ranges, { edgeRanges: 'exclude' })).to.eql([
          createRange(9, 10),
          createRange(11, 13),
          createRange(16, 17),
        ]);
      });

      it('can filter ranges to between a certain range (clip)', () => {
        const { range, ranges } = createRanges();
        expect(DateRange.filterTo(range, ranges, { edgeRanges: 'clip' })).to.eql([
          createRange(9, 10),
          createRange(9, 11),
          createRange(9, 10),
          createRange(11, 13),
          createRange(15, 17),
          createRange(16, 17),
          createRange(9, 17),
        ]);
      });

      it('can filter a specific range 1 (clip)', () => {
        expect(DateRange.filterTo(createRange(20, 21), [createRange(20, 22)], { edgeRanges: 'clip' })).to.eql([createRange(20, 21)]);
      });

    });

    describe('merge', () => {

      it('can merge overlapping ranges', () => {
        expect(DateRange.merge([
          createRange(9, 10),
          createRange(6, 8),
          createRange(10, 18),
          createRange(12, 13),
          createRange(15, 19),
          createRange(20, 21),
        ])).to.eql([
          createRange(9, 19),
          createRange(6, 8),
          createRange(20, 21),
        ]);
      });

    });

    describe('findOverlaps', () => {

      it('can find the overlapping ranges between a single-array of ranges', () => {
        const ranges: DateRange[] = [
          createRange(9, 10),
          createRange(6, 11),
          createRange(9, 18),
        ];
        expect(DateRange.findOverlaps(ranges)).to.eql([createRange(9, 10)]);
      });

      it('can find the overlapping ranges between a multi-array of ranges', () => {
        const ranges: DateRange[][] = [
          [
            createRange(9, 10),
            createRange(6, 8),
            createRange(10, 18),
            createRange(12, 13),
            createRange(15, 19),
            createRange(20, 21),
          ],
          [
            createRange(8, 10),
            createRange(7, 8),
            createRange(10, 11),
            createRange(11, 13),
            createRange(15, 18),
            createRange(19, 22),
          ],
          [
            createRange(9, 10),
            createRange(8, 11),
            createRange(10, 13),
            createRange(15, 18),
            createRange(20, 22),
          ],
        ];
        expect(DateRange.findOverlaps(ranges)).to.eql([
          createRange(9, 13),
          createRange(15, 18),
          createRange(20, 21),
        ]);
      });

    });

    describe('findGaps', () => {

      it('can find the gaps ranges between ranges', () => {
        const ranges: DateRange[] = [
          createRange(9, 10),
          createRange(8, 9),
          createRange(6, 11),
          createRange(10, 12),
          createRange(14, 18),
          createRange(19, 21),
        ];
        expect(DateRange.findGaps(ranges)).to.eql([
          createRange(12, 14),
          createRange(18, 19),
        ]);
      });

      it('can find the gaps ranges between ranges within a certain range', () => {
        const ranges: DateRange[] = [
          createRange(9, 10),
          createRange(8, 9),
          createRange(8, 11),
          createRange(10, 12),
          createRange(14, 18),
          createRange(19, 21),
        ];
        expect(DateRange.findGaps(createRange(7, 23), ranges)).to.eql([
          createRange(7, 8),
          createRange(12, 14),
          createRange(18, 19),
          createRange(21, 23),
        ]);
      });

    });

  });

});
