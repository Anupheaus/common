import './reflect';

describe('reflect', () => {

  describe('areDeepEqual', () => {

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
      expect(Reflect.areDeepEqual(a, b)).to.be.true;
      expect(Reflect.areDeepEqual(a, c)).to.be.false;
    });
  });

  describe('areShallowEqual', () => {

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
      expect(Reflect.areShallowEqual(a, b)).to.be.true;
      expect(Reflect.areShallowEqual(a, c)).to.be.false;
    });

  });

});
