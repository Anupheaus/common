import { expect } from 'chai';
import { traverseObject } from './traverse';

describe('traverse', () => {

  describe('traverseObject', () => {
    it('returns value at simple path', () => {
      const obj = { a: 1 };
      const result = traverseObject(obj, ['a']);
      expect(result.isSet).to.be.true;
      expect(result.value).to.equal(1);
    });

    it('returns value at deep path', () => {
      const obj = { a: { b: { c: 42 } } };
      const result = traverseObject(obj, ['a', 'b', 'c']);
      expect(result.isSet).to.be.true;
      expect(result.value).to.equal(42);
    });

    it('returns isSet false for missing path', () => {
      const obj = { a: 1 };
      const result = traverseObject(obj, ['b']);
      expect(result.isSet).to.be.false;
      expect(result.value).to.be.undefined;
    });

    it('returns isSet false for partial path', () => {
      const obj = { a: {} };
      const result = traverseObject(obj, ['a', 'b', 'c']);
      expect(result.isSet).to.be.false;
    });

    it('empty path returns root', () => {
      const obj = { x: 1 };
      const result = traverseObject(obj, []);
      expect(result.isSet).to.be.true;
      expect(result.value).to.deep.equal(obj);
    });
  });
});
