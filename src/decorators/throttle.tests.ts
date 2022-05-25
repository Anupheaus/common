/* eslint-disable max-classes-per-file */
import { throttle } from './throttle';
import '../extensions/promise';

describe('Throttle Decorator', () => {

  function createThrottleTestClass(delegate: (instance: object, args: unknown[]) => unknown, timeout: number) {
    class TestClass {
      @throttle(timeout)
      public testMethod(...args: unknown[]): unknown {
        return delegate(this, args);
      }
    }
    return new TestClass();
  }

  it('can be applied to a method in a class', () => {
    let self = null;
    const instance = createThrottleTestClass(i => { self = i; }, 1);
    instance.testMethod();
    expect(instance).to.eq(self);
  });

  it('calls the expected number of times and returns the correct value each time', async () => {
    let count = 0;
    const instance = createThrottleTestClass(() => { return ++count; }, 5);
    expect(instance.testMethod()).to.eq(1);
    expect(instance.testMethod()).to.eq(1);
    expect(instance.testMethod()).to.eq(1);
    expect(instance.testMethod()).to.eq(1);
    expect(count).to.eq(1);
    await Promise.delay(6);
    expect(instance.testMethod()).to.eq(2);
    expect(instance.testMethod()).to.eq(2);
    expect(instance.testMethod()).to.eq(2);
    expect(instance.testMethod()).to.eq(2);
    expect(count).to.eq(2);
    await Promise.delay(6);
    expect(instance.testMethod()).to.eq(3);
    expect(instance.testMethod()).to.eq(3);
    expect(instance.testMethod()).to.eq(3);
    expect(instance.testMethod()).to.eq(3);
    expect(count).to.eq(3);
  });

  it('throttles are dependent on arguments sent to function', async () => {
    const argsCount = new Map<string, number>();
    const instance = createThrottleTestClass((_ignored, args: unknown[]) => {
      let counter = argsCount.get(args[0] as string) ?? 0;
      counter++;
      argsCount.set(args[0] as string, counter);
      return counter;
    }, 5);
    expect(instance.testMethod('a')).to.eq(1);
    expect(instance.testMethod('a')).to.eq(1);
    expect(instance.testMethod('b')).to.eq(1);
    expect(instance.testMethod('b')).to.eq(1);
    expect(instance.testMethod('b')).to.eq(1);
    expect(argsCount.get('a')).to.eq(1);
    expect(argsCount.get('b')).to.eq(1);
    expect(argsCount.get('c')).to.be.undefined;
    await Promise.delay(6);
    expect(instance.testMethod('a')).to.eq(2);
    expect(instance.testMethod('a')).to.eq(2);
    expect(instance.testMethod('c')).to.eq(1);
    expect(argsCount.get('a')).to.eq(2);
    expect(argsCount.get('b')).to.eq(1);
    expect(argsCount.get('c')).to.eq(1);
    await Promise.delay(6);
    expect(instance.testMethod('b')).to.eq(2);
    expect(instance.testMethod('b')).to.eq(2);
    expect(instance.testMethod('c')).to.eq(2);
    expect(argsCount.get('a')).to.eq(2);
    expect(argsCount.get('b')).to.eq(2);
    expect(argsCount.get('c')).to.eq(2);
  });

});
