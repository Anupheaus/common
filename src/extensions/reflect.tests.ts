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

  describe('invoke', () => {

    it('can invoke a simple function on a simple object', () => {
      const obj = { test() { return 'hey'; } };
      const result = Reflect.invoke(obj, 'test');
      expect(result).to.eq('hey');
    });

    it('can invoke a simple function on a complex object', () => {
      const obj = { something: { blah: { test() { return 'hey'; } } } };
      const result = Reflect.invoke(obj, 'something.blah.test');
      expect(result).to.eq('hey');
    });

    it('can invoke a complex function on a complex object', () => {
      const obj = { something: { blah: { test() { return this.value; }, value: 10 } } };
      const result = Reflect.invoke(obj, 'something.blah.test');
      expect(result).to.eq(10);
    });

    it('can invoke a complex function on a complex object including a class', () => {
      class Test {
        constructor() { this.value = 10; }
        public value: number;
        public test() { return this.value; }
      }
      const blah = new Test();
      const obj = { something: { blah } };
      const result = Reflect.invoke(obj, 'something.blah.test');
      expect(result).to.eq(10);
    });

    it('can invoke a function with parameters', () => {
      const obj = { something: { blah: { test(val1: number, val2: number, val3: number) { return val1 + val2 + val3; } } } };
      const result = Reflect.invoke(obj, 'something.blah.test', 200, 50, 150);
      expect(result).to.eq(400);
    });

  });

});
