import { InternalError } from '../errors';

declare global {
  // tslint:disable-next-line:interface-name
  interface Function {
    setName(name: string): Function;
    wrap(instance: object, delegate: (args: any[], next: (args: any[]) => any) => any): void;
    empty<TReturn = void>(): () => TReturn;
    emptyAsync<TReturn = void>(): () => Promise<TReturn>;
  }
}

const emptyFunction = () => void 0;
const emptyAsyncFunction = () => Promise.resolve();

Object.addMethods(Function.prototype, [

  function setName(this: Function, name: string): Function {
    Object.defineProperty(this, 'name', { value: name, enumerable: false, configurable: true, writable: false });
    return this;
  },

  function wrap(this: Function, instance: object, delegate: (args: any[], next: (args: any[]) => any) => any): void {
    const originalDefinition = Reflect.getDefinition(instance, this.name);
    if (!originalDefinition) { throw new InternalError(`Unable to find the original definition for method ${this.name} on ${instance.constructor.name}.`); }
    const originalMethod = originalDefinition.value;
    if (typeof (originalMethod) !== 'function') { throw new InternalError(`The original definition for member ${this.name} on ${instance.constructor.name} was not a method.`); }
    const wrappedMethod = function method(...args: any[]) { return delegate(args, newArgs => originalMethod.apply(instance, newArgs)); };
    wrappedMethod.setName(this.name);
    Object.defineProperty(instance, this.name, {
      value: wrappedMethod,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  },

  function empty(this: Function): () => void {
    return emptyFunction;
  },

  function emptyAsync(this: Function): () => Promise<void> {
    return emptyAsyncFunction;
  },

]);
