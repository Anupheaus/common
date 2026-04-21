import { pathsMatch, convertToCorrectPropertyType } from './proxyUtils';

describe('proxy > proxyUtils', () => {

  describe('pathsMatch', () => {

    describe('exact matching (includeSubProperties = false)', () => {

      it('matches identical single-segment paths', () => {
        expect(pathsMatch(['a'], ['a'], false)).to.be.true;
      });

      it('matches identical multi-segment paths', () => {
        expect(pathsMatch(['a', 'b', 'c'], ['a', 'b', 'c'], false)).to.be.true;
      });

      it('does not match when paths differ', () => {
        expect(pathsMatch(['a'], ['b'], false)).to.be.false;
      });

      it('does not match when paths2 is longer than paths1', () => {
        expect(pathsMatch(['a'], ['a', 'b'], false)).to.be.false;
      });

      it('does not match when paths1 is longer than paths2', () => {
        expect(pathsMatch(['a', 'b'], ['a'], false)).to.be.false;
      });

      it('matches two empty paths', () => {
        expect(pathsMatch([], [], false)).to.be.true;
      });

      it('does not match empty paths1 against non-empty paths2 without includeSubProperties', () => {
        expect(pathsMatch([], ['a'], false)).to.be.false;
      });

    });

    describe('sub-property matching (includeSubProperties = true)', () => {

      it('matches when paths2 starts with paths1 prefix', () => {
        expect(pathsMatch(['a'], ['a', 'b'], true)).to.be.true;
      });

      it('matches when paths2 is the same as paths1', () => {
        expect(pathsMatch(['a', 'b'], ['a', 'b'], true)).to.be.true;
      });

      it('does not match when paths1 prefix does not match paths2', () => {
        expect(pathsMatch(['a'], ['b', 'c'], true)).to.be.false;
      });

      it('does not match when paths2 is shorter than paths1', () => {
        expect(pathsMatch(['a', 'b'], ['a'], true)).to.be.false;
      });

      it('empty paths1 matches any paths2 when includeSubProperties is true', () => {
        expect(pathsMatch([], ['a', 'b', 'c'], true)).to.be.true;
        expect(pathsMatch([], [], true)).to.be.true;
      });

    });

    describe('with symbol keys', () => {

      it('matches symbol keys correctly', () => {
        const sym = Symbol('key');
        expect(pathsMatch([sym], [sym], false)).to.be.true;
      });

      it('does not match different symbol keys', () => {
        const sym1 = Symbol('key');
        const sym2 = Symbol('key');
        expect(pathsMatch([sym1], [sym2], false)).to.be.false;
      });

    });

  });

  describe('convertToCorrectPropertyType', () => {

    it('converts a numeric string to a number', () => {
      expect(convertToCorrectPropertyType('0')).to.equal(0);
      expect(convertToCorrectPropertyType('42')).to.equal(42);
      expect(convertToCorrectPropertyType('3.14')).to.equal(3.14);
    });

    it('returns string unchanged when it is not purely numeric', () => {
      expect(convertToCorrectPropertyType('foo')).to.equal('foo');
      expect(convertToCorrectPropertyType('42px')).to.equal('42px');
      expect(convertToCorrectPropertyType('')).to.equal('');
    });

    it('returns number keys unchanged', () => {
      expect(convertToCorrectPropertyType(7)).to.equal(7);
    });

    it('returns symbol keys unchanged', () => {
      const sym = Symbol('test');
      expect(convertToCorrectPropertyType(sym)).to.equal(sym);
    });

  });

});
