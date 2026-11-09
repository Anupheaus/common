import '../../extensions/array';
import '../../extensions/date';
import { serialise, deserialise } from './serialisation';
import { DateTime } from 'luxon';
import { Error as BaseError } from '../../errors/BaseError';
import '../../errors/InternalError';

describe('serialisation', () => {

  describe('serialise', () => {

    it('converts a DateTime to a UTC ISO string inside JSON', () => {
      const dt = DateTime.fromISO('2024-01-15T12:00:00.000Z');
      const result = serialise({ date: dt });
      const parsed = JSON.parse(result);
      expect(parsed.date).to.be.a('string').and.include('2024-01-15');
    });

    it('converts a native Date to an ISO string inside JSON', () => {
      const date = new Date('2024-01-15T12:00:00.000Z');
      const result = serialise({ date });
      const parsed = JSON.parse(result);
      expect(parsed.date).to.be.a('string').and.include('2024-01-15');
    });

    it('recursively serialises DateTime values inside arrays', () => {
      const dt = DateTime.fromISO('2024-06-01T00:00:00.000Z');
      const result = serialise([dt, 'text', 42]);
      const parsed = JSON.parse(result);
      expect(parsed[0]).to.be.a('string').and.include('2024-06-01');
      expect(parsed[1]).to.equal('text');
      expect(parsed[2]).to.equal(42);
    });

    it('recursively serialises DateTime values inside nested objects', () => {
      const dt = DateTime.fromISO('2024-03-10T08:00:00.000Z');
      const result = serialise({ outer: { inner: dt } });
      const parsed = JSON.parse(result);
      expect(parsed.outer.inner).to.be.a('string').and.include('2024-03-10');
    });

    it('passes primitive values through unchanged', () => {
      expect(JSON.parse(serialise(42))).to.equal(42);
      expect(JSON.parse(serialise('hello'))).to.equal('hello');
      expect(JSON.parse(serialise(true))).to.equal(true);
      expect(JSON.parse(serialise(null))).to.equal(null);
    });

    it('serialises Error instances to a JSON string', () => {
      const err = new BaseError({ message: 'test error', title: 'Test' });
      const result = serialise({ err });
      const parsed = JSON.parse(result);
      expect(parsed.err).to.be.a('string');
      const innerParsed = JSON.parse(parsed.err);
      expect(innerParsed.message).to.equal('test error');
    });

    it('applies a custom replacer before built-in serialisation', () => {
      const result = serialise({ value: 42 }, (key, value) => {
        if (key === 'value') return 'replaced';
      });
      expect(JSON.parse(result).value).to.equal('replaced');
    });

  });

  describe('deserialise', () => {

    it('parses a JSON object string and converts ISO date strings to DateTime', () => {
      const json = '{"date":"2024-01-15T12:00:00.000Z","count":3}';
      const result = deserialise(json) as Record<string, unknown>;
      expect(DateTime.isDateTime(result['date'])).to.be.true;
      expect(result['count']).to.equal(3);
    });

    it('parses a JSON array string and converts ISO date strings within it', () => {
      const json = '["2024-01-15T12:00:00.000Z","hello",42]';
      const result = deserialise(json) as unknown[];
      expect(DateTime.isDateTime(result[0])).to.be.true;
      expect(result[1]).to.equal('hello');
      expect(result[2]).to.equal(42);
    });

    it('converts a bare ISO string directly to a DateTime', () => {
      const result = deserialise('2024-01-15T12:00:00.000Z');
      expect(DateTime.isDateTime(result)).to.be.true;
    });

    it('deserialises a plain non-ISO string unchanged', () => {
      expect(deserialise('just a plain string')).to.equal('just a plain string');
    });

    it('passes through numbers and booleans unchanged', () => {
      expect(deserialise(42)).to.equal(42);
      expect(deserialise(true)).to.equal(true);
      expect(deserialise(null)).to.equal(null);
    });

    it('converts an error-like object to a BaseError instance', () => {
      const errObj = { '@error': 'Error', message: 'something broke', title: 'Error', name: 'Error' };
      const result = deserialise(errObj);
      expect(result).to.be.instanceOf(BaseError);
      expect((result as BaseError).message).to.equal('something broke');
    });

    it('preserves the message when deserialising a registered typed error', () => {
      const errObj = { '@error': 'InternalError', message: 'boom', title: 'Internal Error', name: 'InternalError' };
      const result = deserialise(errObj) as BaseError;
      expect(result).to.be.instanceOf(BaseError);
      expect(result.message).to.equal('boom');
    });

    it('recursively deserialises nested object values', () => {
      const obj = { timestamp: '2024-06-01T08:00:00.000Z', label: 'hello' };
      const result = deserialise(obj) as Record<string, unknown>;
      expect(DateTime.isDateTime(result['timestamp'])).to.be.true;
      expect(result['label']).to.equal('hello');
    });

    it('recursively deserialises array values when passed directly', () => {
      const arr = ['2024-01-15T00:00:00.000Z', 'plain'];
      const result = deserialise(arr) as unknown[];
      expect(DateTime.isDateTime(result[0])).to.be.true;
      expect(result[1]).to.equal('plain');
    });

    it('throws on an invalid JSON string that starts with {', () => {
      expect(() => deserialise('{not valid json}')).to.throw();
    });

    it('throws on an invalid JSON string that starts with [', () => {
      expect(() => deserialise('[broken')).to.throw();
    });

    it('applies a custom reviver before built-in deserialisation', () => {
      const json = '{"name":"Alice","date":"2024-01-15T12:00:00.000Z"}';
      const result = deserialise(json, (key, value) => {
        if (key === 'name') return 'Bob';
      }) as Record<string, unknown>;
      expect(result['name']).to.equal('Bob');
      expect(DateTime.isDateTime(result['date'])).to.be.true;
    });

    it('round-trips a complex object through serialise then deserialise', () => {
      const dt = DateTime.fromISO('2024-05-20T10:30:00.000Z');
      const original = { label: 'test', created: dt, count: 7, active: true };
      const json = serialise(original);
      const result = deserialise(json) as typeof original;
      expect(result.label).to.equal('test');
      expect(DateTime.isDateTime(result.created)).to.be.true;
      expect(result.count).to.equal(7);
      expect(result.active).to.equal(true);
    });

  });

  describe('output of the round trip', () => {

    it('writes nested dates, errors, nulls and missing values exactly as before', () => {
      const dt = DateTime.fromISO('2024-01-15T12:00:00.000Z');
      const date = new Date('2024-02-01T09:30:00.000Z');
      const err = new BaseError({ message: 'nested boom', title: 'Nested' });
      const value = { a: { b: [dt, { c: date, d: null, e: undefined }, undefined], f: 'x' }, g: 1, err };
      const parsed = JSON.parse(serialise(value));
      expect(parsed.a).to.deep.equal({ b: ['2024-01-15T12:00:00.000Z', { c: '2024-02-01T09:30:00.000Z', d: null }, null], f: 'x' });
      expect(parsed.g).to.equal(1);
      expect(parsed.err).to.be.a('string');
      expect(JSON.parse(parsed.err).message).to.equal('nested boom');
    });

    it('lets a replacer at a nested key see the value already converted, as before', () => {
      const dt = DateTime.fromISO('2024-01-15T12:00:00.000Z');
      const seen: unknown[] = [];
      serialise({ outer: { when: dt } }, (key, keyValue) => { if (key === 'when') seen.push(keyValue); });
      expect(seen).to.deep.equal(['2024-01-15T12:00:00.000Z']);
    });

    it('keeps a "__proto__" key as an ordinary entry and never changes the prototype', () => {
      const parsedInput = JSON.parse('{"__proto__":{"polluted":true},"ok":1}');
      const serialised = serialise(parsedInput);
      expect(JSON.parse(serialised)).to.have.own.property('__proto__');
      const result = deserialise(parsedInput) as Record<string, unknown>;
      expect(Object.getPrototypeOf(result)).to.equal(Object.prototype);
      expect(Object.prototype.hasOwnProperty.call(result, '__proto__')).to.be.true;
      expect((result as { polluted?: boolean }).polluted).to.be.undefined;
      expect(({} as { polluted?: boolean }).polluted).to.be.undefined;
    });

    it('revives dates and errors at every depth of an object passed in directly', () => {
      const value = { a: { b: [{ c: '2024-01-15T12:00:00.000Z' }] }, err: { '@error': 'Error', message: 'deep', title: 'Error', name: 'Error' } };
      const result = deserialise(value) as { a: { b: { c: unknown }[] }; err: unknown };
      expect(DateTime.isDateTime(result.a.b[0].c)).to.be.true;
      expect(result.err).to.be.instanceOf(BaseError);
    });

  });

  describe('matches the previous implementation on generated values (sc-5052)', () => {
    const CASES = 300;
    const MAX_DEPTH = 4;
    const MAX_ENTRIES = 5;

    // ─── The implementation before sc-5052, kept verbatim as the oracle for "output unchanged" ───
    const isOldDateTime = (value: unknown) => DateTime.isDateTime(value) || value instanceof Date;
    const isOldError = (value: unknown) => BaseError.isErrorObject(value) || value instanceof globalThis.Error;
    const oldSerialiseDateTime = (value: DateTime | Date): string => DateTime.isDateTime(value) ? value.toUTC().toISO() ?? '' : oldSerialiseDateTime(DateTime.fromJSDate(value));
    const oldSerialiseValue = (value: unknown): unknown => {
      if (isOldDateTime(value)) return oldSerialiseDateTime(value as DateTime | Date);
      if (isOldError(value)) return JSON.stringify(value);
      if (Array.isArray(value)) return value.map(oldSerialiseValue);
      if (typeof value === 'object' && value != null) {
        return Object.entries(value).reduce((map, [key, entry]) => ({ ...map, [key]: oldSerialiseValue(entry) }), {});
      }
      return value;
    };
    const oldSerialise = (value: unknown, replacer?: (key: string, value: unknown) => unknown) => JSON.stringify(value, (key, keyValue) => {
      if (replacer) {
        const newValue = replacer(key, keyValue);
        if (newValue !== undefined) return newValue;
      }
      return oldSerialiseValue(keyValue);
    });

    /** A class instance (not a plain object), optionally carrying an `@error` key, which only the copy turns into an error object. */
    class Holder {
      constructor(public label: string, errorType?: string) {
        if (errorType != null) Object.defineProperty(this, '@error', { value: errorType, enumerable: true });
      }
    }

    /** A small deterministic random number generator (mulberry32), so a failing case can be reproduced. */
    const createRandom = (seed: number) => () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let mixed = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
      return ((mixed ^ (mixed >>> 14)) >>> 0) / 4_294_967_296;
    };

    const KEYS = ['a', 'b', '__proto__', 'when', 'items', '@error', 'message', 'toJSON', '0', 'emoji \u{1F600}'];

    const generate = (random: () => number, depth: number): unknown => {
      const pick = Math.floor(random() * (depth >= MAX_DEPTH ? 9 : 13));
      switch (pick) {
        case 0: return null;
        case 1: return undefined;
        case 2: return Math.floor(random() * 1_000) - 500;
        case 3: return 'plain text';
        case 4: return '2024-01-15T12:00:00.000Z';
        case 5: return DateTime.fromISO('2024-03-10T08:00:00.000+05:00');
        case 6: return new Date('2024-02-01T09:30:00.000Z');
        case 7: return new BaseError({ message: 'generated', title: 'Generated' });
        case 8: return random() < 0.5;
        case 9: return new Holder('held', random() < 0.5 ? 'Error' : undefined);
        case 10: return Array.from({ length: Math.floor(random() * MAX_ENTRIES) }, () => generate(random, depth + 1));
        default: {
          const result: Record<string, unknown> = {};
          const entryCount = Math.floor(random() * MAX_ENTRIES);
          for (let entryIndex = 0; entryIndex < entryCount; entryIndex++) {
            Object.defineProperty(result, KEYS[Math.floor(random() * KEYS.length)], { value: generate(random, depth + 1), enumerable: true, writable: true, configurable: true });
          }
          return result;
        }
      }
    };

    it('serialises every generated value to exactly the same JSON', () => {
      const random = createRandom(5052);
      for (let caseIndex = 0; caseIndex < CASES; caseIndex++) {
        const value = { root: generate(random, 0) };
        expect(serialise(value), `case ${caseIndex}`).to.equal(oldSerialise(value));
      }
    });

    it('gives a replacer exactly the same keys and values, in the same order', () => {
      const random = createRandom(4409);
      for (let caseIndex = 0; caseIndex < CASES; caseIndex++) {
        const value = { root: generate(random, 0) };
        const seenNow: string[] = [];
        const seenBefore: string[] = [];
        const replaceDates = (seen: string[]) => (key: string, keyValue: unknown) => {
          seen.push(`${key}=${typeof keyValue === 'object' && keyValue != null ? Object.keys(keyValue).join(',') : String(keyValue)}`);
          if (key === 'when') return 'replaced';
        };
        expect(serialise(value, replaceDates(seenNow)), `case ${caseIndex}`).to.equal(oldSerialise(value, replaceDates(seenBefore)));
        expect(seenNow, `case ${caseIndex}`).to.deep.equal(seenBefore);
      }
    });

  });

  describe('time taken grows in proportion to the size of the value (sc-5052)', () => {
    const RUNS = 5;
    /** Linear work doubles when the size doubles; quadratic work quadruples. 3 sits between, with room for noise. */
    const MAX_GROWTH_WHEN_DOUBLED = 3;
    const MAX_MS_FOR_50_000_KEYS = 1_000;

    const wideObject = (keyCount: number) => {
      const result: Record<string, unknown> = {};
      for (let keyIndex = 0; keyIndex < keyCount; keyIndex++) result[`key${keyIndex}`] = keyIndex % 2 === 0 ? keyIndex : '2024-01-15T12:00:00.000Z';
      return result;
    };

    /** A chain `levels` deep, each level holding `leavesPerLevel` plain values beside the next level. */
    const deepObject = (levels: number, leavesPerLevel: number) => {
      let result: Record<string, unknown> = {};
      for (let level = 0; level < levels; level++) {
        const parent: Record<string, unknown> = { child: result };
        for (let leafIndex = 0; leafIndex < leavesPerLevel; leafIndex++) parent[`leaf${leafIndex}`] = leafIndex;
        result = parent;
      }
      return result;
    };

    /** The median of several timed runs, after one warm-up run, so a single slow run does not decide the test. */
    const medianMs = (delegate: () => void) => {
      delegate();
      const timings: number[] = [];
      for (let run = 0; run < RUNS; run++) {
        const startedAt = performance.now();
        delegate();
        timings.push(performance.now() - startedAt);
      }
      timings.sort((first, second) => first - second);
      return timings[Math.floor(RUNS / 2)];
    };

    const roundTrip = (value: unknown) => () => { deserialise(serialise(value)); };

    it('a round trip of 20,000 keys at one level takes about twice as long as 10,000, not four times', () => {
      const small = medianMs(roundTrip(wideObject(10_000)));
      const large = medianMs(roundTrip(wideObject(20_000)));
      expect(large / Math.max(small, 1)).to.be.lessThan(MAX_GROWTH_WHEN_DOUBLED);
    }).timeout(60_000);

    it('deserialising an object passed in directly grows in proportion to its key count', () => {
      const small = medianMs(() => { deserialise(wideObject(10_000)); });
      const large = medianMs(() => { deserialise(wideObject(20_000)); });
      expect(large / Math.max(small, 1)).to.be.lessThan(MAX_GROWTH_WHEN_DOUBLED);
    }).timeout(60_000);

    it('a round trip of 50,000 keys at one level finishes in well under a second', () => {
      expect(medianMs(roundTrip(wideObject(50_000)))).to.be.lessThan(MAX_MS_FOR_50_000_KEYS);
    }).timeout(60_000);

    it('walks each level of a deeply nested object once, not once per level above it', () => {
      const small = medianMs(roundTrip(deepObject(400, 20)));
      const large = medianMs(roundTrip(deepObject(800, 20)));
      expect(large / Math.max(small, 1)).to.be.lessThan(MAX_GROWTH_WHEN_DOUBLED);
    }).timeout(60_000);

  });

});
