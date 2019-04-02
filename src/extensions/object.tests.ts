import './object';
import './array';

describe('object', () => {

  describe('merge', () => {

    it('can merge objects with getters and setters without changing them', () => {
      const a = {
        a: 1,
      };
      let b = {
        a: 7,
        b: undefined,
      };

      Object.defineProperty(b, 'b', {
        get() { return this.a; },
        enumerable: true,
        configurable: true,
      });

      expect(b.b).to.eq(7);
      b = Object.merge({}, b, a);
      expect(b.b).to.eq(1);
    });

    it('can merge objects and override getters and setters', () => {
      const a = {
        a: 1,
        b: 8,
      };
      let b = {
        a: 7,
        b: undefined,
      };

      Object.defineProperty(b, 'b', {
        get() { return this.a; },
        enumerable: true,
        configurable: true,
      });

      expect(b.b).to.eq(7);
      b = Object.merge({}, b, a);
      expect(b.b).to.eq(8);
    });

    it('can merge objects with undefined in first extension', () => {
      const a = {
        a: 1,
        b: { something: 'else' },
      };
      let b = {
        a: 7,
        b: undefined,
      };

      expect(b.b).to.be.undefined;
      b = Object.merge({}, b, a);
      expect(b.b).to.eql({ something: 'else' });
    });

    it('can merge objects with undefined in second extension', () => {
      const a = {
        a: 1,
        b: undefined,
      };
      let b = {
        a: 7,
        b: 8,
      };

      expect(b.b).to.eq(8);
      b = Object.merge({}, b, a);
      expect(b.b).to.eq(8);
    });

    it('can merge objects with undefined from a getter in the first extension', () => {
      const a = {
        a: 1,
        b: 8,
      };

      let b = {
        a: 7,
        b: undefined,
      };
      Object.defineProperty(b, 'b', {
        get() { return undefined; },
        enumerable: true,
        configurable: true,
      });

      expect(b.b).to.be.undefined;
      b = Object.merge({}, b, a);
      expect(b.b).to.eq(8);
    });

    it('can merge arrays correctly', () => {
      const a = {
        a: [1, 3, 5],
      };

      let b = {
        a: [2, 4],
      };

      b = Object.merge({}, b, a);
      expect(b.a).to.eql([1, 3, 5]);
    });

    it('can merge overridable items correctly', () => {
      const a = {
        a: [{ id: 3, something: '3' }, { id: 1, something: '1' }, { id: 2, something: '2', boo: 'not' }],
      };

      let b = {
        a: [{ id: 2, something: 'else', with: 'more' }],
      };

      b = Object.merge({}, a, b);
      expect(b.a).to.eql([{ id: 2, something: 'else', with: 'more', boo: 'not' }]);
    });

  });

});
