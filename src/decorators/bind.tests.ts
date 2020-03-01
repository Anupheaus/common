/* eslint-disable max-classes-per-file */
import { bind } from './bind';

describe('Bind Decorator', () => {

  function createBoundTestClass(delegate: (instance: object) => void) {
    class TestClass {
      @bind
      public testMethod(): void {
        delegate(this);
      }
    }
    return new TestClass();
  }

  function createBoundDerivedTestClass(baseDelegate: (instance: object) => void, derivedDelegate: (instance: object) => void) {
    class TestClass {
      @bind
      public testMethod(): void {
        baseDelegate(this);
      }

      public boo(): string {
        return 'boo';
      }
    }
    class DerivedTestClass extends TestClass {
      @bind
      public testMethod(): void {
        derivedDelegate(this);
        super.testMethod();
      }
    }
    return new DerivedTestClass();
  }

  function createBoundDerivedViaFunctionTestClass(baseDelegate: (instance: object) => void, derivedDelegate: (instance: object) => void) {
    abstract class TestClass {
      @bind
      public testMethod(): void {
        baseDelegate(this);
      }
    }
    function extendFrom<T>(cls: T): T { return cls as T; }
    class DerivedTestClass extends extendFrom(TestClass) {
      @bind
      public testMethod(): void {
        derivedDelegate(this);
        super.testMethod();
      }
    }
    return new DerivedTestClass();
  }

  it('can be applied to a method in a class', () => {
    let self = null;
    const instance = createBoundTestClass(i => { self = i; });
    instance.testMethod();
    expect(instance).to.eq(self);
  });

  it('still works correctly when explicitly called via a call', () => {
    let self = null;
    const instance = createBoundTestClass(i => { self = i; });
    instance.testMethod.call({ bob: 1 });
    expect(instance).to.eq(self);
  });

  it('still works correctly when explicitly called via a bind', () => {
    let self = null;
    const instance = createBoundTestClass(i => { self = i; });
    const method = instance.testMethod.bind({ bob: 1 });
    method();
    expect(instance).to.eq(self);
  });

  it('still works correctly when explicitly called via an apply', () => {
    let self = null;
    const instance = createBoundTestClass(i => { self = i; });
    instance.testMethod.apply({ bob: 1 });
    expect(instance).to.eq(self);
  });

  it('can be applied to a method in a derived class and works when the method is overridden', () => {
    let baseInstance = null;
    let derivedInstance = null;
    const instance = createBoundDerivedTestClass(bi => { baseInstance = bi; }, di => { derivedInstance = di; });
    instance.testMethod();
    expect(baseInstance).to.eq(instance);
    expect(derivedInstance).to.eq(instance);
  });

  it('can be applied to a method in a derived class and works every time the method is called', () => {
    let baseCount = 0;
    let derivedCount = 0;
    const instance = createBoundDerivedTestClass(() => { baseCount++; }, () => { derivedCount++; });
    for (let index = 1; index < 10; index++) {
      instance.testMethod();
      expect(baseCount).to.eq(index);
      expect(derivedCount).to.eq(index);
    }
  });

  it('can be applied to a method in a derived via function class and works when the method is overridden', () => {
    let baseInstance = null;
    let derivedInstance = null;
    const instance = createBoundDerivedViaFunctionTestClass(bi => { baseInstance = bi; }, di => { derivedInstance = di; });
    instance.testMethod();
    expect(baseInstance).to.eq(instance);
    expect(derivedInstance).to.eq(instance);
  });

  it('cannot be applied to class', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      @bind
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      class FailTestClass { // eslint-disable-line @typescript-eslint/no-unused-vars

      }
    }).to.throw('@bind decorator can only be applied to methods not a class');
  });

  it('cannot be applied to variable', () => {
    expect(() => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      class FailTestClass { // eslint-disable-line @typescript-eslint/no-unused-vars
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        @bind
        public something: string | undefined;
      }
    }).to.throw('@bind decorator can only be applied to methods not a variable');
  });

  it('rebinds if set after having called it first', () => {
    class RebindTest {
      public value: string | undefined;

      @bind
      public test(value: string): void {
        this.value = value;
      }
    }
    const test = new RebindTest();
    let setTest = test.test;
    setTest('test');
    expect(test.value).to.eq('test');
    let localValue: string | undefined;
    test.test = function (value: string) {
      localValue = this.value;
      this.value = value;
    };
    setTest = test.test;
    expect(localValue).to.undefined;
    setTest('rebound');
    expect(test.value).to.eq('rebound');
    expect(localValue).to.eq('test');
  });

  it('rebinds if set before being called first', () => {
    class RebindTest {
      public value: string | undefined;

      @bind
      public test(value: string): void {
        this.value = value;
      }
    }
    const test = new RebindTest();
    expect(test.value).to.undefined;
    test.test = function (value: string) {
      this.value = value;
    };
    const setTest = test.test;
    setTest('rebound');
    expect(test.value).to.eq('rebound');
  });

  it('binds correctly if destructured and called independently of the instance', () => {
    class DestructureTest {
      public value: string | undefined;

      @bind
      public testMethod(value: string): void {
        this.value = value;
      }
    }
    const instance = new DestructureTest();
    expect(instance.value).to.be.undefined;
    const { testMethod } = instance;
    testMethod('something');
    expect(instance.value).to.eq('something');
  });

});
