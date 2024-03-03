/* eslint-disable max-classes-per-file */
import { createProxyOf } from '../proxy';
import { is } from './is';

describe('is', () => {

  describe('null', () => {

    it('detects null values', () => {
      expect(is.null(null)).to.be.true;
      expect(is.null(undefined)).to.be.true;
    });

    it('detects non-null values', () => {
      expect(is.null(new Object())).to.be.false;
      expect(is.null('')).to.be.false;
      expect(is.null(-1)).to.be.false;
      expect(is.null(NaN)).to.be.false;
    });

    it('returns a default value if null', () => {
      expect(is.null(null, () => 'hey')).to.eq('hey');
      expect(is.null(undefined, () => 17456)).to.eq(17456);
    });

    it('returns the value if not null', () => {
      expect(is.null('blah', () => 2)).to.eq('blah');
      expect(is.null(2, () => 'hey')).to.eq(2);
    });

    it('can be used within a loop', () => {
      const a = [1, 2, null, undefined, 5, null];
      const b = a.filter(is.null);
      expect(b).to.eql([null, undefined, null]);
    });

  });

  describe('not null', () => {

    it('detects null values', () => {
      expect(is.not.null(null)).to.be.false;
      expect(is.not.null(undefined)).to.be.false;
    });

    it('detects not null values', () => {
      expect(is.not.null(new Object())).to.be.true;
      expect(is.not.null('')).to.be.true;
      expect(is.not.null(-1)).to.be.true;
      expect(is.not.null(NaN)).to.be.true;
    });

    it('returns a default value if null', () => {
      expect(is.not.null(null, () => 'hey')).to.eq('hey');
      expect(is.not.null(undefined, () => 17456)).to.eq(17456);
    });

    it('returns the value if not null', () => {
      expect(is.not.null('blah', () => 2)).to.eq('blah');
      expect(is.not.null(2, () => 'hey')).to.eq(2);
    });

    it('can be used within a loop', () => {
      const a = [1, 2, null, undefined, 5, null];
      const b = a.filter(is.not.null);
      expect(b).to.eql([1, 2, 5]);
    });

  });

  // describe('not allNull', () => {

  //   it('detects null values and returns the first non-null value', () => {
  //     expect(is.not.allNull(() => null, () => undefined, () => 'blah', () => 'foo')).to.eq('blah');
  //   });

  //   it('returns undefined if not found', () => {
  //     expect(is.not.allNull(() => null, () => undefined, () => undefined, () => null)).to.be.undefined;
  //   });

  // });

  describe('function', () => {

    it('detects functions correctly', () => {
      function myFunc() { /* do nothing */ }
      expect(is.function(() => void 0)).to.be.true;
      expect(is.function(myFunc)).to.be.true;
    });

    it('detects non-functions correctly', () => {
      class MyClass { }
      expect(is.function('')).to.be.false;
      expect(is.function(2)).to.be.false;
      expect(is.function(new Object())).to.be.false;
      expect(is.function({})).to.be.false;
      expect(is.function(MyClass)).to.be.false;
    });

  });

  describe('class', () => {

    it('detects classes correctly', () => {
      class MyClass { }
      expect(is.class(MyClass)).to.be.true;
    });

    it('detects non-classes correctly', () => {
      expect(is.class('')).to.be.false;
      expect(is.class(2)).to.be.false;
      expect(is.class(new Object())).to.be.false;
      expect(is.class({})).to.be.false;
      expect(is.class(() => void 0)).to.be.false;
    });

  });

  describe('guid', () => {

    it('detects guids correctly', () => {
      expect(is.guid('ca761232ed4211cebacd00aa0057b223')).to.be.true;
      expect(is.guid('CA761232-ED42-11CE-BACD-00AA0057B223')).to.be.true;
      expect(is.guid('{CA761232-ED42-11CE-BACD-00AA0057B223}')).to.be.true;
      expect(is.guid('(CA761232-ED42-11CE-BACD-00AA0057B223)')).to.be.true;
    });

    it('detects non-guids correctly', () => {
      expect(is.guid('ca76132ed4211cebacd00aa0057b223')).to.be.false;
      expect(is.guid('CA761232_ED42-11CE-BACD-00AA0057B223')).to.be.false;
      expect(is.guid('[CA761232-ED42-11CE-BACD-00AA0057B223]')).to.be.false;
      expect(is.guid(2)).to.be.false;
      expect(is.guid({})).to.be.false;
      expect(is.guid(() => void 0)).to.be.false;
      expect(is.guid([])).to.be.false;
    });

  });

  describe('array', () => {

    it('detects arrays correctly', () => {
      expect(is.array([])).to.be.true;
      expect(is.array(new Array(3))).to.be.true;
    });

    it('detects non-arrays correctly', () => {
      expect(is.array('')).to.be.false;
      expect(is.array(2)).to.be.false;
      expect(is.array(new Object())).to.be.false;
      expect(is.array({})).to.be.false;
    });

    it('does not have any type issues', () => {
      const parseUnknown = (value: unknown) => value;
      const parseNumber = (value: number) => value;
      const unknownValue: unknown = null;
      const anyArray: unknown[] = [];
      const numberArray: number[] = [];
      const combinedArray = null as unknown as number | number[];
      const mixedArray: (string | number)[] = [];
      if (is.array(combinedArray)) combinedArray.filter(parseNumber);
      if (is.array(unknownValue)) unknownValue.filter(parseUnknown);
      if (is.array(unknownValue)) unknownValue.filter(parseNumber);
      if (is.array(anyArray)) anyArray.filter(parseUnknown);
      if (is.array(anyArray)) anyArray.filter(parseNumber as any);
      if (is.array<number>(anyArray)) anyArray.filter(parseNumber);
      if (is.array(numberArray)) numberArray.filter(parseNumber);
      if (is.array<number>(mixedArray)) mixedArray.filter(parseNumber);
    });

  });

  describe('deepEqual', () => {

    it('can compare successfully', () => {
      const a = {
        a: 0,
        b: 'test',
        c: false,
        d: new Date(1550091018032),
        e: {
          a: 0,
        },
        f: () => { /* do nothing */ },
        g: Number.NaN,
      };
      const b = {
        a: 0,
        b: 'test',
        c: false,
        d: new Date(1550091018032),
        e: {
          a: 0,
        },
        f: () => { /* do nothing */ },
        g: Number.NaN,
      };
      const c = {
        ...a,
        e: {
          b: 0,
        },
      };
      expect(is.deepEqual(a, b)).to.be.true;
      expect(is.deepEqual(a, c)).to.be.false;
    });
  });

  describe('shallowEqual', () => {

    it('can compare successfully', () => {
      const a = {
        a: 0,
        b: 'test',
        c: false,
        d: new Date(1550091018032),
        e: {
          a: 0,
        },
        f: () => { /* do nothing */ },
        g: Number.NaN,
      };
      const b = {
        a: 0,
        b: 'test',
        c: false,
        d: new Date(1550091018032),
        e: a.e,
        f: () => { /* do nothing */ },
        g: Number.NaN,
      };
      const c = {
        ...a,
        e: {
          a: 0,
        },
      };
      expect(is.shallowEqual(a, b)).to.be.true;
      expect(is.shallowEqual(a, c)).to.be.false;
    });

  });

  describe('proxy', () => {

    it('can detect a proxy', () => {
      const myObject = { a: { b: { c: 1 } } };
      const { proxy: myProxy } = createProxyOf(myObject);
      expect(is.proxy(myProxy)).to.be.true;
      expect(is.proxy(myObject)).to.be.false;
      expect(is.proxy(myProxy.a)).to.be.true;
      expect(is.proxy(myProxy.a.b)).to.be.true;
      expect(is.proxy(myProxy.a.b.c)).to.be.true;
    });

  });

});