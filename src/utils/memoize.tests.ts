import { memoize } from './memoize';

describe('memoize', () => {

  it('generally works as expected', () => {
    let innerHits = 0;

    const func = memoize((value: number) => {
      innerHits++;
      return value + 10;
    });

    expect(innerHits).to.eq(0);
    expect(func(10)).to.eq(20);
    expect(innerHits).to.eq(1);
    expect(func(20)).to.eq(30);
    expect(innerHits).to.eq(2);
    expect(func(10)).to.eq(20);
    expect(innerHits).to.eq(2);
    expect(func(20)).to.eq(30);
    expect(innerHits).to.eq(2);
  });

  it('works with a set function used inside a function', () => {
    let innerHits = 0;

    function test(innerValue: number) {
      innerHits++;
      return innerValue + 10;
    }

    const calculate = (value: number) => {
      const func = memoize(test);
      return func(value);
    };

    expect(innerHits).to.eq(0);
    expect(calculate(10)).to.eq(20);
    expect(innerHits).to.eq(1);
    expect(calculate(20)).to.eq(30);
    expect(innerHits).to.eq(2);
    expect(calculate(10)).to.eq(20);
    expect(innerHits).to.eq(2);
    expect(calculate(20)).to.eq(30);
    expect(innerHits).to.eq(2);
  });

  it('same function uses same cache', () => {
    let innerHits = 0;

    function test(innerValue: number) {
      innerHits++;
      return innerValue + 10;
    }

    const calculate1 = (value: number) => {
      const func = memoize(test);
      return func(value);
    };

    const calculate2 = (value: number) => {
      const func = memoize(test);
      return func(value);
    };

    expect(innerHits).to.eq(0);
    expect(calculate1(10)).to.eq(20);
    expect(innerHits).to.eq(1);
    expect(calculate1(20)).to.eq(30);
    expect(innerHits).to.eq(2);
    expect(calculate2(10)).to.eq(20);
    expect(innerHits).to.eq(2);
    expect(calculate2(20)).to.eq(30);
    expect(innerHits).to.eq(2);
  });

});