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

});
