import { isEqual } from './is.equal';
import { DateTime } from 'luxon';

describe('isEqual', () => {

  describe('primitives', () => {
    const equalPairs: [unknown, unknown][] = [
      [1, 1],
      ['hello', 'hello'],
      [true, true],
      [false, false],
      [null, null],
      [undefined, undefined],
      [NaN, NaN],
      [0, 0],
      [-0, -0],
    ];

    const unequalPairs: [unknown, unknown][] = [
      [1, 2],
      ['a', 'b'],
      [true, false],
      [null, undefined],
      [0, false],
      [1, '1'],
      [0, null],
    ];

    equalPairs.forEach(([a, b]) => {
      it(`considers ${String(a)} and ${String(b)} equal`, () => {
        expect(isEqual(a, b, false)).to.be.true;
      });
    });

    unequalPairs.forEach(([a, b]) => {
      it(`considers ${String(a)} and ${String(b)} not equal`, () => {
        expect(isEqual(a, b, false)).to.be.false;
      });
    });
  });

  describe('functions (as object property values)', () => {
    // compareFunctions is applied when walking object keys, not at top level.
    // Top-level function comparison uses reference equality from fast-equals.

    it('considers objects with function properties equal when the functions share the same body and name', () => {
      const a = function myFn() { return 42; };
      const b = function myFn() { return 42; };
      expect(isEqual({ fn: a }, { fn: b }, false)).to.be.true;
    });

    it('considers objects not equal when function properties have different names', () => {
      const a = function fnA() { return 42; };
      const b = function fnB() { return 42; };
      expect(isEqual({ fn: a }, { fn: b }, false)).to.be.false;
    });

    it('considers objects not equal when function properties have different bodies', () => {
      const a = function myFn() { return 42; };
      const b = function myFn() { return 99; };
      expect(isEqual({ fn: a }, { fn: b }, false)).to.be.false;
    });

    it('considers an object with a function property not equal to one with a non-function at the same key', () => {
      expect(isEqual({ fn: () => { /* */ } }, { fn: 'not a function' }, false)).to.be.false;
    });

    it('considers the same function reference equal to itself at the top level', () => {
      const fn = function myFn() { return 1; };
      expect(isEqual(fn, fn, false)).to.be.true;
    });

    it('considers two different function references not equal at the top level', () => {
      // Top-level functions are compared by reference (fast-equals default behaviour)
      const a = function myFn() { return 42; };
      const b = function myFn() { return 42; };
      expect(isEqual(a, b, false)).to.be.false;
    });
  });

  describe('Date comparisons', () => {
    it('considers two Dates with the same time equal', () => {
      expect(isEqual(new Date('2024-01-15T12:00:00Z'), new Date('2024-01-15T12:00:00Z'), false)).to.be.true;
    });

    it('considers two Dates with different times not equal', () => {
      expect(isEqual(new Date('2024-01-15'), new Date('2024-01-16'), false)).to.be.false;
    });

    it('considers two identical DateTime instances equal', () => {
      const a = DateTime.fromISO('2024-01-15T12:00:00Z');
      const b = DateTime.fromISO('2024-01-15T12:00:00Z');
      expect(isEqual(a, b, false)).to.be.true;
    });

    it('considers two different DateTime instances not equal', () => {
      const a = DateTime.fromISO('2024-01-15T12:00:00Z');
      const b = DateTime.fromISO('2024-01-16T12:00:00Z');
      expect(isEqual(a, b, false)).to.be.false;
    });

    it('considers a Date and a DateTime not equal even with same instant', () => {
      const a = new Date('2024-01-15T12:00:00Z');
      const b = DateTime.fromISO('2024-01-15T12:00:00Z');
      expect(isEqual(a, b, false)).to.be.false;
      expect(isEqual(b, a, false)).to.be.false;
    });

    it('considers a Date not equal to a non-Date', () => {
      expect(isEqual(new Date('2024-01-15'), '2024-01-15', false)).to.be.false;
    });
  });

  describe('deep equality (isShallow = false)', () => {
    it('considers deeply equal plain objects equal', () => {
      expect(isEqual({ a: 1, b: 2 }, { a: 1, b: 2 }, false)).to.be.true;
    });

    it('considers objects with different values not equal', () => {
      expect(isEqual({ a: 1 }, { a: 2 }, false)).to.be.false;
    });

    it('considers objects with different keys not equal', () => {
      expect(isEqual({ a: 1 }, { b: 1 }, false)).to.be.false;
    });

    it('recursively compares nested objects', () => {
      expect(isEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 1 } } }, false)).to.be.true;
      expect(isEqual({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } }, false)).to.be.false;
    });

    it('compares arrays element-by-element', () => {
      expect(isEqual([1, 2, 3], [1, 2, 3], false)).to.be.true;
      expect(isEqual([1, 2, 3], [1, 2, 4], false)).to.be.false;
      expect(isEqual([1, 2], [1, 2, 3], false)).to.be.false;
    });

    it('compares arrays of objects recursively', () => {
      expect(isEqual([{ x: 1 }], [{ x: 1 }], false)).to.be.true;
      expect(isEqual([{ x: 1 }], [{ x: 2 }], false)).to.be.false;
    });

    it('considers an array not equal to an object', () => {
      expect(isEqual([], {}, false)).to.be.false;
    });
  });

  describe('ignoreUndefined option', () => {
    it('ignores undefined-valued keys by default (ignoreUndefined = true)', () => {
      expect(isEqual({ a: 1, b: undefined }, { a: 1 }, false)).to.be.true;
      expect(isEqual({ a: 1 }, { a: 1, b: undefined }, false)).to.be.true;
    });

    it('treats undefined-valued keys as significant when ignoreUndefined = false', () => {
      expect(isEqual({ a: 1, b: undefined }, { a: 1 }, false, { ignoreUndefined: false })).to.be.false;
    });

    it('two objects each with the same undefined key are equal even when ignoreUndefined = false', () => {
      expect(isEqual({ a: 1, b: undefined }, { a: 1, b: undefined }, false, { ignoreUndefined: false })).to.be.true;
    });
  });

  describe('shallow equality (isShallow = true)', () => {
    it('considers top-level primitive values by value', () => {
      expect(isEqual({ a: 1 }, { a: 1 }, true)).to.be.true;
      expect(isEqual({ a: 1 }, { a: 2 }, true)).to.be.false;
    });

    it('considers nested objects equal only when they share the same reference', () => {
      const nested = { b: 1 };
      expect(isEqual({ a: nested }, { a: nested }, true)).to.be.true;
    });

    it('considers nested objects at different references not equal even if deeply equal', () => {
      expect(isEqual({ a: { b: 1 } }, { a: { b: 1 } }, true)).to.be.false;
    });

    it('considers nested arrays equal only when they share the same reference', () => {
      const arr = [1, 2];
      expect(isEqual({ a: arr }, { a: arr }, true)).to.be.true;
      expect(isEqual({ a: [1, 2] }, { a: [1, 2] }, true)).to.be.false;
    });
  });

  describe('circular references', () => {
    it('does not throw when objects contain circular references', () => {
      const a: Record<string, unknown> = { x: 1 };
      a['self'] = a;
      const b: Record<string, unknown> = { x: 1 };
      b['self'] = b;
      expect(() => isEqual(a, b, false)).to.not.throw();
    });

    it('considers structurally identical circular objects equal', () => {
      const a: Record<string, unknown> = { x: 1 };
      a['self'] = a;
      const b: Record<string, unknown> = { x: 1 };
      b['self'] = b;
      expect(isEqual(a, b, false)).to.be.true;
    });
  });

});
