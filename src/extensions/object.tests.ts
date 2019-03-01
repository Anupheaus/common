import './object';
import './array';

describe.only('merge', () => {

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

  it.only('can merge objects and override getters and setters', () => {
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

});
