import { to } from './to';

describe('to', () => {

  describe('string', () => {

    it('can convert a number to a string', () => {
      expect(to.string(34)).to.be.a('string').and.eq('34');
      expect(to.string(35456544)).to.be.a('string').and.eq('35456544');
    });

    it('can convert a number to a string with a format', () => {
      expect(to.string(345845484, '#,##0')).to.be.a('string').and.eq('345,845,484');
      expect(to.string(345845484, '$#,##0')).to.be.a('string').and.eq('$345,845,484');
    });

    it('returns a string value unchanged', () => {
      expect(to.string('hello')).to.equal('hello');
    });

    it('returns empty string for null/undefined when no default provided', () => {
      expect(to.string(null)).to.equal('');
      expect(to.string(undefined)).to.equal('');
    });

    it('returns defaultValue for null/undefined when provided', () => {
      expect(to.string(null, 'fallback')).to.equal('fallback');
      expect(to.string(undefined, 'fallback')).to.equal('fallback');
    });

    it('returns empty string when allowEmpty is false and value is empty string', () => {
      expect(to.string('', false)).to.equal('');
    });

    it('returns defaultValue when allowEmpty is false and value is empty string', () => {
      expect(to.string('', 'default', false)).to.equal('default');
    });

  });

  describe('boolean', () => {

    const truthyValues = [true, 1, 'true', 'True', 'TRUE', ' true ', '1'];
    const falsyValues = [false, 0, 'false', 'False', 'FALSE', '0'];

    truthyValues.forEach(value => {
      it(`converts ${JSON.stringify(value)} to true`, () => {
        expect(to.boolean(value as any)).to.be.true;
      });
    });

    falsyValues.forEach(value => {
      it(`converts ${JSON.stringify(value)} to false`, () => {
        expect(to.boolean(value as any)).to.be.false;
      });
    });

    it('returns false for null when no default', () => {
      expect(to.boolean(null as any)).to.be.false;
    });

    it('returns defaultValue for null when provided', () => {
      expect(to.boolean(null as any, true)).to.be.true;
    });

    it('evaluates a function and returns its boolean result', () => {
      expect(to.boolean(() => true)).to.be.true;
      expect(to.boolean(() => false)).to.be.false;
    });

  });

  describe('number', () => {

    it('returns a number value unchanged', () => {
      expect(to.number(42)).to.equal(42);
      expect(to.number(0)).to.equal(0);
      expect(to.number(-7)).to.equal(-7);
    });

    it('parses an integer string', () => {
      expect(to.number('123')).to.equal(123);
    });

    it('parses a float string', () => {
      expect(to.number('3.14')).to.equal(3.14);
    });

    it('parses a string with leading numeric characters', () => {
      expect(to.number('42px')).to.equal(42);
    });

    it('returns defaultValue for non-numeric string', () => {
      expect(to.number('abc', 0)).to.equal(0);
    });

    it('returns undefined for non-numeric string when no default', () => {
      expect(to.number('abc')).to.be.undefined;
    });

    it('returns defaultValue for null/undefined', () => {
      expect(to.number(null, 5)).to.equal(5);
      expect(to.number(undefined, 5)).to.equal(5);
    });

  });

  describe('function', () => {

    it('returns the function unchanged', () => {
      const fn = () => 42;
      expect(to.function(fn)).to.equal(fn);
    });

    it('returns defaultValue when value is not a function', () => {
      const fallback = () => 0;
      expect(to.function(null, fallback)).to.equal(fallback);
    });

    it('returns a no-op when value is not a function and no default provided', () => {
      const result = to.function(null as any);
      expect(result).to.be.a('function');
    });

  });

  describe('object', () => {

    it('returns the object unchanged', () => {
      const obj = { a: 1 };
      expect(to.object(obj)).to.equal(obj);
    });

    it('returns defaultValue when value is null', () => {
      const fallback = { b: 2 };
      expect(to.object(null, fallback)).to.equal(fallback);
    });

    it('returns empty object when value is null and no default provided', () => {
      expect(to.object(null as any)).to.deep.equal({});
    });

  });

  describe('array', () => {

    it('returns the array unchanged', () => {
      const arr = [1, 2, 3];
      expect(to.array(arr)).to.equal(arr);
    });

    it('returns empty array when value is not an array', () => {
      expect(to.array(null as any)).to.deep.equal([]);
      expect(to.array(undefined as any)).to.deep.equal([]);
      expect(to.array('foo' as any)).to.deep.equal([]);
    });

  });

  describe('type (introspection)', () => {

    it('returns "string" for string values', () => {
      expect(to.type('hello')).to.equal('string');
    });

    it('returns "number" for number values', () => {
      expect(to.type(42)).to.equal('number');
    });

    it('returns "boolean" for boolean values', () => {
      expect(to.type(true)).to.equal('boolean');
    });

    it('returns "date" for Date instances', () => {
      expect(to.type(new Date())).to.equal('date');
    });

    it('returns "array" for arrays', () => {
      expect(to.type([])).to.equal('array');
    });

    it('returns "object" for plain objects', () => {
      expect(to.type({})).to.equal('object');
    });

    it('returns "function" for functions', () => {
      expect(to.type(() => void 0)).to.equal('function');
    });

    it('returns "undefined" for undefined', () => {
      expect(to.type(undefined)).to.equal('undefined');
    });

  });

  describe('switchMap', () => {

    it('returns the mapped value for a matching key', () => {
      expect(to.switchMap('a' as 'a' | 'b', { a: 1, b: 2, '*': 99 })).to.equal(1);
    });

    it('returns the wildcard value when key does not match', () => {
      expect(to.switchMap('c' as any, { a: 1, '*': 99 })).to.equal(99);
    });

  });

  describe('plural', () => {

    it('singularises when count is 1', () => {
      expect(to.plural('dogs', 1)).to.equal('dog');
    });

    it('pluralises when count is not 1', () => {
      expect(to.plural('dog', 2)).to.equal('dogs');
      expect(to.plural('dog', 0)).to.equal('dogs');
    });

  });

  describe('error', () => {

    it('returns a BaseError wrapping a native Error', () => {
      const native = new globalThis.Error('boom');
      const result = to.error(native);
      expect(result).not.to.be.undefined;
      expect(result!.message).to.equal('boom');
    });

    it('returns undefined for non-error values', () => {
      expect(to.error('string')).to.be.undefined;
      expect(to.error(42)).to.be.undefined;
      expect(to.error(null)).to.be.undefined;
    });

  });

  describe('differences', () => {

    it('returns empty array for identical objects', () => {
      expect(to.differences({ a: 1 }, { a: 1 })).to.deep.equal([]);
    });

    it('returns replace op when a property value changes', () => {
      const diffs = to.differences({ a: 1 }, { a: 2 });
      expect(diffs).to.have.length(1);
      expect(diffs[0].op).to.equal('replace');
      expect(diffs[0].value).to.equal(2);
    });

    it('returns remove op when a property is deleted', () => {
      const diffs = to.differences({ a: 1, b: 2 }, { a: 1 });
      expect(diffs.some(d => d.op === 'remove')).to.be.true;
    });

    it('filters out add ops where value is null', () => {
      const diffs = to.differences({ a: 1 }, { a: 1, b: null });
      expect(diffs.some(d => d.op === 'add')).to.be.false;
    });

  });

  describe('serialise / deserialise round-trip', () => {

    it('round-trips a plain object', () => {
      const obj = { x: 1, y: 'hello', z: true };
      expect(to.deserialise(to.serialise(obj))).to.deep.equal(obj);
    });

    it('round-trips an array', () => {
      const arr = [1, 'two', false];
      expect(to.deserialise(to.serialise(arr))).to.deep.equal(arr);
    });

  });

  describe('deserialise with malformed JSON', () => {
    it('should throw a descriptive error for malformed JSON string', () => {
      expect(() => to.deserialise('{not valid json')).to.throw(/Failed to deserialise/);
    });

    it('should parse valid JSON objects', () => {
      const result = to.deserialise<{ key: string }>('{"key":"value"}');
      expect(result).to.eql({ key: 'value' });
    });

    it('should parse valid JSON arrays', () => {
      const result = to.deserialise<number[]>('[1, 2, 3]');
      expect(result).to.eql([1, 2, 3]);
    });
  });

  describe('proxy', () => {

    it('can create a proxy', () => {
      const target = { something: 'hey', setToUndefined: undefined };
      const result = to.proxy(target);
      expect(result).not.to.be.undefined;
      expect(result).to.have.property('proxy').and.is.an('object');
      expect(result).to.have.property('get').and.is.a('function');
      expect(result).to.have.property('set').and.is.a('function');
      expect(result).to.have.property('onAfterSet').and.is.a('function');
      expect(result).to.have.property('onDefault').and.is.a('function');
      expect(result).to.have.property('onGet').and.is.a('function');
      expect(result).to.have.property('onSet').and.is.a('function');
    });

    it('proxy get returns target and set mutates it', () => {
      const target = { count: 0 };
      const { proxy, get, set } = to.proxy(target);
      expect(get()).to.deep.equal({ count: 0 });
      set(proxy.count, 5);
      expect(get().count).to.equal(5);
    });

  });

});