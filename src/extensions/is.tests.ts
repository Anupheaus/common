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

    it('should return true on repeated calls with the same valid GUID', () => {
      const guid = '6BA7B810-9DAD-11D1-80B4-00C04FD430C8';
      expect(is.guid(guid)).to.be.true;
      expect(is.guid(guid)).to.be.true;
      expect(is.guid(guid)).to.be.true;
    });

    it('should return false on repeated calls for invalid GUIDs', () => {
      expect(is.guid('not-a-guid')).to.be.false;
      expect(is.guid('not-a-guid')).to.be.false;
    });

    it('should return true for a valid uppercase GUID', () => {
      expect(is.guid('6BA7B810-9DAD-11D1-80B4-00C04FD430C8')).to.be.true;
    });

    it('should return false for non-string values', () => {
      expect(is.guid(null)).to.be.false;
      expect(is.guid(123)).to.be.false;
      expect(is.guid(undefined)).to.be.false;
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

    it('two identical primitives are equal', () => {
      expect(is.deepEqual(1, 1)).to.be.true;
      expect(is.deepEqual('x', 'x')).to.be.true;
      expect(is.deepEqual(true, true)).to.be.true;
    });

    it('different primitives are not equal', () => {
      expect(is.deepEqual(1, 2)).to.be.false;
      expect(is.deepEqual('x', 'y')).to.be.false;
    });

    it('treats two Date instances with the same time as equal', () => {
      expect(is.deepEqual(new Date(1000), new Date(1000))).to.be.true;
    });

    it('treats two Date instances with different times as not equal', () => {
      expect(is.deepEqual(new Date(1000), new Date(2000))).to.be.false;
    });

    it('treats a Date and a non-Date as not equal', () => {
      expect(is.deepEqual(new Date(1000), 1000)).to.be.false;
    });

    it('treats two functions with the same body and name as equal', () => {
      const f1 = function myFn() { return 42; };
      const f2 = function myFn() { return 42; };
      expect(is.deepEqual({ fn: f1 }, { fn: f2 })).to.be.true;
    });

    it('treats two functions with different bodies as not equal', () => {
      const f1 = function a() { return 1; };
      const f2 = function b() { return 2; };
      expect(is.deepEqual({ fn: f1 }, { fn: f2 })).to.be.false;
    });

    it('treats undefined property values as equal when ignoreUndefined is true (default)', () => {
      const a = { x: 1, y: undefined };
      const b = { x: 1 };
      expect(is.deepEqual(a, b)).to.be.true;
    });

    it('treats undefined property values as not equal when ignoreUndefined is false', () => {
      const a = { x: 1, y: undefined };
      const b = { x: 1 };
      expect(is.deepEqual(a, b, { ignoreUndefined: false })).to.be.false;
    });

    it('handles null values', () => {
      expect(is.deepEqual(null, null)).to.be.true;
      expect(is.deepEqual(null, undefined)).to.be.false;
    });

    it('handles nested object equality recursively', () => {
      expect(is.deepEqual({ a: { b: { c: 3 } } }, { a: { b: { c: 3 } } })).to.be.true;
      expect(is.deepEqual({ a: { b: { c: 3 } } }, { a: { b: { c: 4 } } })).to.be.false;
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

    it('considers two objects with same primitive values as equal', () => {
      expect(is.shallowEqual({ a: 1, b: 'x' }, { a: 1, b: 'x' })).to.be.true;
    });

    it('considers two objects sharing the same nested reference as equal', () => {
      const inner = { val: 42 };
      expect(is.shallowEqual({ inner }, { inner })).to.be.true;
    });

    it('considers two objects with different nested references but same shape as not equal', () => {
      expect(is.shallowEqual({ inner: { val: 1 } }, { inner: { val: 1 } })).to.be.false;
    });

    it('considers objects with different key counts as not equal', () => {
      expect(is.shallowEqual({ a: 1 }, { a: 1, b: 2 })).to.be.false;
    });

    it('treats undefined values as equal when ignoreUndefined is true (default)', () => {
      expect(is.shallowEqual({ a: 1, b: undefined }, { a: 1 })).to.be.true;
    });

    it('treats undefined values as not equal when ignoreUndefined is false', () => {
      expect(is.shallowEqual({ a: 1, b: undefined }, { a: 1 }, { ignoreUndefined: false })).to.be.false;
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

  describe('string', () => {

    it('returns true for string values', () => {
      expect(is.string('')).to.be.true;
      expect(is.string('hello')).to.be.true;
    });

    it('returns false for non-string values', () => {
      expect(is.string(42)).to.be.false;
      expect(is.string(null)).to.be.false;
      expect(is.string([])).to.be.false;
    });

  });

  describe('number', () => {

    it('returns true for valid numbers', () => {
      expect(is.number(0)).to.be.true;
      expect(is.number(42)).to.be.true;
      expect(is.number(-7)).to.be.true;
    });

    it('returns false for NaN', () => {
      expect(is.number(NaN)).to.be.false;
    });

    it('returns false for non-numbers', () => {
      expect(is.number('42')).to.be.false;
      expect(is.number(null)).to.be.false;
    });

  });

  describe('boolean', () => {

    it('returns true for boolean values', () => {
      expect(is.boolean(true)).to.be.true;
      expect(is.boolean(false)).to.be.true;
    });

    it('returns false for non-boolean values', () => {
      expect(is.boolean(1)).to.be.false;
      expect(is.boolean('true')).to.be.false;
      expect(is.boolean(null)).to.be.false;
    });

  });

  describe('object', () => {

    it('returns true for plain objects', () => {
      expect(is.object({ a: 1 })).to.be.true;
    });

    it('returns false for null', () => {
      expect(is.object(null)).to.be.false;
    });

    it('returns false for arrays', () => {
      expect(is.object([])).to.be.false;
    });

    it('returns false for primitives', () => {
      expect(is.object('hello')).to.be.false;
      expect(is.object(42)).to.be.false;
    });

    it('returns false for Date instances', () => {
      expect(is.object(new Date())).to.be.false;
    });

  });

  describe('plainObject', () => {

    it('returns true for plain objects', () => {
      expect(is.plainObject({})).to.be.true;
      expect(is.plainObject({ a: 1 })).to.be.true;
      expect(is.plainObject(Object.create(null))).to.be.true;
    });

    it('returns false for class instances', () => {
      class MyClass { }
      expect(is.plainObject(new MyClass())).to.be.false;
    });

    it('returns false for null, arrays, and primitives', () => {
      expect(is.plainObject(null)).to.be.false;
      expect(is.plainObject([])).to.be.false;
      expect(is.plainObject('foo')).to.be.false;
    });

  });

  describe('record', () => {

    it('returns true for plain objects with an id property', () => {
      expect(is.record({ id: 'abc', name: 'test' })).to.be.true;
    });

    it('returns false when id is missing', () => {
      expect(is.record({ name: 'test' })).to.be.false;
    });

    it('returns false for non-objects', () => {
      expect(is.record(null)).to.be.false;
      expect(is.record('abc')).to.be.false;
    });

  });

  describe('date', () => {

    it('returns true for Date instances', () => {
      expect(is.date(new Date())).to.be.true;
    });

    it('returns false for non-date values', () => {
      expect(is.date('2023-01-01')).to.be.false;
      expect(is.date(1000)).to.be.false;
      expect(is.date(null)).to.be.false;
    });

    it('returns the value when it is a date and default is provided', () => {
      const d = new Date();
      expect(is.date(d, new Date(0))).to.equal(d);
    });

    it('returns the defaultValue when value is not a date', () => {
      const fallback = new Date(0);
      expect(is.date(null, fallback)).to.equal(fallback);
    });

  });

  describe('promise', () => {

    it('returns true for native Promise instances', () => {
      expect(is.promise(Promise.resolve())).to.be.true;
    });

    it('returns true for thenable/catchable objects', () => {
      const thenableObj = { then: () => { }, catch: () => { } };
      expect(is.promise(thenableObj as any)).to.be.true;
    });

    it('returns false for non-promises', () => {
      expect(is.promise(null)).to.be.false;
      expect(is.promise(42)).to.be.false;
      expect(is.promise({})).to.be.false;
    });

  });

  describe('empty', () => {

    it('returns true for empty string', () => {
      expect(is.empty('')).to.be.true;
    });

    it('returns true for whitespace-only string', () => {
      expect(is.empty('   ')).to.be.true;
    });

    it('returns false for non-empty string', () => {
      expect(is.empty('hello')).to.be.false;
    });

    it('returns false for non-zero number', () => {
      expect(is.empty(1)).to.be.false;
    });

    it('returns true for zero (0 is considered empty)', () => {
      expect(is.empty(0)).to.be.true;
    });

    it('returns true for null and undefined', () => {
      expect(is.empty(null)).to.be.true;
      expect(is.empty(undefined)).to.be.true;
    });

  });

  describe('blank', () => {

    it('returns true for empty string', () => {
      expect(is.blank('')).to.be.true;
    });

    it('returns true for whitespace-only string', () => {
      expect(is.blank('   ')).to.be.true;
    });

    it('returns false for non-empty string', () => {
      expect(is.blank('hello')).to.be.false;
    });

    it('returns true for null and undefined', () => {
      expect(is.blank(null)).to.be.true;
      expect(is.blank(undefined)).to.be.true;
    });

    it('returns true for numbers (only strings can be non-blank)', () => {
      expect(is.blank(42 as unknown as string)).to.be.true;
    });

  });

  describe('numeric', () => {

    it('returns true for numeric strings', () => {
      expect(is.numeric('0')).to.be.true;
      expect(is.numeric('123')).to.be.true;
      expect(is.numeric('-5')).to.be.true;
      expect(is.numeric('3.14')).to.be.true;
    });

    it('returns false for non-numeric strings', () => {
      expect(is.numeric('abc')).to.be.false;
      expect(is.numeric('12abc')).to.be.false;
      expect(is.numeric('')).to.be.false;
    });

    it('returns false for null and undefined', () => {
      expect(is.numeric(null as unknown as string)).to.be.false;
      expect(is.numeric(undefined)).to.be.false;
    });

  });

  describe('enum', () => {

    enum Direction { Up = 'Up', Down = 'Down' }

    it('returns true when value is a valid enum key', () => {
      expect(is.enum('Up', Direction)).to.be.true;
      expect(is.enum('Down', Direction)).to.be.true;
    });

    it('returns false when value is not in the enum', () => {
      expect(is.enum('Left', Direction)).to.be.false;
      expect(is.enum('', Direction)).to.be.false;
    });

    it('returns false for null', () => {
      expect(is.enum(null, Direction)).to.be.false;
    });

  });

  describe('email', () => {

    const validEmails = ['user@example.com', 'a@b.co', 'test+filter@domain.org'];
    const invalidEmails = ['plainaddress', '@domain.com', 'user@', 'user @domain.com', null, 42];

    validEmails.forEach(email => {
      it(`returns true for valid email: ${email}`, () => {
        expect(is.email(email)).to.be.true;
      });
    });

    invalidEmails.forEach(email => {
      it(`returns false for invalid email: ${JSON.stringify(email)}`, () => {
        expect(is.email(email)).to.be.false;
      });
    });

  });

  describe('instance', () => {

    it('returns true for class instances', () => {
      class Foo { }
      expect(is.instance(new Foo())).to.be.true;
    });

    it('returns false for plain objects', () => {
      expect(is.instance({})).to.be.false;
    });

    it('returns false for class constructors (prototypes)', () => {
      class Bar { }
      expect(is.instance(Bar)).to.be.false;
    });

  });

  describe('primitive', () => {

    it('returns true for string, number, and boolean', () => {
      expect(is.primitive('hello')).to.be.true;
      expect(is.primitive(42)).to.be.true;
      expect(is.primitive(true)).to.be.true;
    });

    it('returns false for null and undefined', () => {
      expect(is.primitive(null)).to.be.false;
      expect(is.primitive(undefined)).to.be.false;
    });

    it('returns false for plain objects', () => {
      expect(is.primitive({})).to.be.false;
    });

    it('returns true for arrays (arrays are not is.object so they pass primitive check)', () => {
      // is.primitive uses !is.object(), and is.object returns false for arrays
      expect(is.primitive([])).to.be.true;
    });

  });

  describe('isISODateString', () => {

    const validISOStrings = [
      '2023-01-15T10:30:00Z',
      '2023-01-15T10:30:00.123Z',
      '2023-01-15T10:30:00+05:30',
      '2023-01-15T10:30:00',
    ];
    const invalidISOStrings = ['2023-01-15', '01/15/2023', 'not-a-date', '', null, 42];

    validISOStrings.forEach(str => {
      it(`returns true for valid ISO date string: ${str}`, () => {
        expect(is.isISODateString(str)).to.be.true;
      });
    });

    invalidISOStrings.forEach(str => {
      it(`returns false for invalid ISO date string: ${JSON.stringify(str)}`, () => {
        expect(is.isISODateString(str)).to.be.false;
      });
    });

  });

  describe('listItem', () => {

    it('returns true for valid ListItem objects', () => {
      expect(is.listItem({ id: 'a', text: 'Item A' })).to.be.true;
    });

    it('returns false when id is missing or blank', () => {
      expect(is.listItem({ text: 'Item' })).to.be.false;
      expect(is.listItem({ id: '', text: 'Item' })).to.be.false;
    });

    it('returns false when text property is absent', () => {
      expect(is.listItem({ id: 'a' })).to.be.false;
    });

    it('returns false for non-objects', () => {
      expect(is.listItem(null)).to.be.false;
      expect(is.listItem('string')).to.be.false;
    });

  });

  describe('keyValuePair', () => {

    it('returns true for objects with key and value properties', () => {
      expect(is.keyValuePair({ key: 'a', value: 1 })).to.be.true;
    });

    it('returns false when key is missing', () => {
      expect(is.keyValuePair({ value: 1 })).to.be.false;
    });

    it('returns false when value is missing', () => {
      expect(is.keyValuePair({ key: 'a' })).to.be.false;
    });

    it('returns false for non-objects', () => {
      expect(is.keyValuePair(null)).to.be.false;
    });

  });

  describe('errorLike', () => {

    it('returns true for native Error instances', () => {
      expect(is.errorLike(new Error('boom'))).to.be.true;
    });

    it('returns true for plain objects with @error property', () => {
      expect(is.errorLike({ '@error': 'ValidationError' })).to.be.true;
    });

    it('returns false for plain objects without @error', () => {
      expect(is.errorLike({ message: 'oops' })).to.be.false;
    });

    it('returns false for primitives', () => {
      expect(is.errorLike('error')).to.be.false;
      expect(is.errorLike(null)).to.be.false;
    });

  });

  describe('not.blank', () => {

    it('returns true for non-empty strings (including whitespace-only)', () => {
      expect(is.not.blank('hello')).to.be.true;
      expect(is.not.blank('  x  ')).to.be.true;
      // whitespace-only has length > 0 so is.not.blank considers it non-blank
      expect(is.not.blank('   ')).to.be.true;
    });

    it('returns false for empty string and non-strings', () => {
      expect(is.not.blank('')).to.be.false;
      expect(is.not.blank(null)).to.be.false;
      expect(is.not.blank(undefined)).to.be.false;
    });

    it('can be used in an array filter — filters out empty strings and non-strings', () => {
      const values: unknown[] = ['hello', '', null, 'world'];
      const result = (values as string[]).filter(is.not.blank);
      expect(result).to.deep.equal(['hello', 'world']);
    });

  });

  describe('not.empty', () => {

    it('returns true for non-empty strings', () => {
      expect(is.not.empty('hello')).to.be.true;
    });

    it('returns true for non-zero numbers', () => {
      expect(is.not.empty(1)).to.be.true;
    });

    it('returns false for empty string and zero', () => {
      expect(is.not.empty('')).to.be.false;
      expect(is.not.empty(0)).to.be.false;
    });

    it('returns false for null and undefined', () => {
      expect(is.not.empty(null)).to.be.false;
      expect(is.not.empty(undefined)).to.be.false;
    });

  });

  describe('not.array', () => {

    it('returns true for non-array values', () => {
      expect(is.not.array('hello')).to.be.true;
      expect(is.not.array(42)).to.be.true;
      expect(is.not.array({})).to.be.true;
    });

    it('returns false for arrays', () => {
      expect(is.not.array([])).to.be.false;
      expect(is.not.array([1, 2, 3])).to.be.false;
    });

  });

  describe('browser', () => {

    it('should return false in a Node.js test environment', () => {
      expect(is.browser()).to.be.false;
    });

  });

  describe('node', () => {

    it('should return true in a Node.js test environment', () => {
      expect(is.node()).to.be.true;
    });

  });

});