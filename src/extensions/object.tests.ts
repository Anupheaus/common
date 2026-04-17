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
      expect(b.a).to.eq(1);
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

    it('can merge an array into an empty object correctly', () => {
      const b = {
        a: [],
      };
      const c = {
        b: 'something',
      };
      const d = Object.merge({}, b, c);
      expect(d.a).to.eql(b.a); // same values
      expect(d.a).not.to.eq(b.a); // but not the same instance
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

    it('does not modify the extenders', () => {
      const a = { items: [{ boo: 2 }] };
      const b = { items: [{ boo: 3 }] };
      const result = Object.merge({}, a, b);
      expect(result.items[0].boo).to.eq(3);
      expect(a.items[0].boo).to.eq(2);
      expect(b.items[0].boo).to.eq(3);
    });

    it('does not ignore falsy values in merge', () => {
      const result = Object.merge({}, { previous: [{ date: 0, something: false, other: undefined }] });
      expect(result.previous).to.be.an('array').and.have.lengthOf(1);
      expect(result.previous[0]).to.eql({ date: 0, something: false, other: undefined });
    });

    describe('prototype pollution protection', () => {
      afterEach(() => {
        delete (Object.prototype as any).polluted;
      });

      it('should ignore __proto__ key', () => {
        const target = { a: 1 };
        const source = JSON.parse('{"__proto__": {"polluted": true}}');
        Object.merge(target, source as any);
        expect((Object.prototype as any).polluted).to.be.undefined;
        expect((target as any).polluted).to.be.undefined;
      });

      it('should ignore constructor key', () => {
        const target = { a: 1 };
        const source = JSON.parse('{"constructor": {"prototype": {"polluted": true}}}');
        Object.merge(target, source as any);
        expect((Object.prototype as any).polluted).to.be.undefined;
        expect((target as any).constructor).to.equal(Object);
      });

      it('should ignore prototype key', () => {
        const target = { a: 1 };
        const source = { prototype: { polluted: true } } as any;
        Object.merge(target, source);
        expect((Object.prototype as any).polluted).to.be.undefined;
        expect(Object.getPrototypeOf(target)).to.equal(Object.prototype);
      });

      it('should still merge normal keys', () => {
        const target = { a: 1 };
        const source = { b: 2 };
        const result = Object.merge(target, source);
        expect(result).to.eql({ a: 1, b: 2 });
      });
    });

  });

  describe('stringify', () => {

    it('can stringify recursive objects', () => {
      class MyTest {
        constructor(value: object) {
          this.value = value;
        }
        public value: object;
        public test(): void {
          /* do nothing */
        }
      }
      const myPlainObject = { test: 2, get myClass() { return myClass; } };
      const myClass = new MyTest(myPlainObject);

      expect(Object.stringify({ myPlainObject }).length).to.eq(51);
    });

  });

});
