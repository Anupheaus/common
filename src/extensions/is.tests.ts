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

  describe('not allNull', () => {

    it('detects null values and returns the first non-null value', () => {
      expect(is.not.allNull(() => null, () => undefined, () => 'blah', () => 'foo')).to.eq('blah');
    });

    it('returns undefined if not found', () => {
      expect(is.not.allNull(() => null, () => undefined, () => undefined, () => null)).to.be.undefined;
    })

  });

  describe('function', () => {

    it('detects functions correctly', () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      function myFunc() { }
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

  });

});