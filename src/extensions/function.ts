import './array';
import { InternalError } from '../errors/InternalError';

const callStackRegExp = new RegExp(/^\s{4}at\s(\S+)\s\((.*?):(\d+):(\d+)\)$/, 'gmi');

export interface IFunctionStackTraceInfo {
  methodName: string;
  file: string;
  line: number;
  column: number;
}

declare global {
  // tslint:disable-next-line:interface-name
  interface Function {
    setName<T extends Function>(this: T, name: string): T;
    wrap(instance: object, delegate: (args: unknown[], next: (args: unknown[]) => unknown) => unknown): void;
    empty<TReturn = void>(): () => TReturn;
    emptyAsync<TReturn = void>(): () => Promise<TReturn>;
    getStackTrace(): IFunctionStackTraceInfo[];
  }
}

const emptyFunction = () => void 0;
const emptyAsyncFunction = () => Promise.resolve();

Object.addMethods(Function.prototype, [

  function setName(this: Function, name: string): Function {
    Object.defineProperty(this, 'name', { value: name, enumerable: false, configurable: true, writable: false });
    return this;
  },

  function wrap(this: Function, instance: object, delegate: (args: unknown[], next: (args: unknown[]) => unknown) => unknown): void {
    const originalDefinition = Reflect.getDefinition(instance, this.name);
    if (!originalDefinition) { throw new InternalError(`Unable to find the original definition for method ${this.name} on ${instance.constructor.name}.`); }
    const originalMethod = originalDefinition.value;
    if (typeof (originalMethod) !== 'function') { throw new InternalError(`The original definition for member ${this.name} on ${instance.constructor.name} was not a method.`); }
    const wrappedMethod = function method(...args: unknown[]) { return delegate(args, newArgs => originalMethod.apply(instance, newArgs)); };
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

  function getStackTrace(this: Function): IFunctionStackTraceInfo[] {
    const errorStack = new Error().stack ?? '';
    const matches = errorStack.match(callStackRegExp);
    if (!matches || matches.length < 2) { return []; }
    return matches.skip(1)
      .map((match): IFunctionStackTraceInfo | undefined => {
        const result = new RegExp(callStackRegExp, 'gmi').exec(match);
        if (result == null) { return; }
        const methodName = result[1];
        const file = result[2];
        const line = parseInt(result[3], 10);
        const column = parseInt(result[4], 10);

        return {
          methodName,
          file,
          line,
          column,
        };
      })
      .removeNull();
  }

]);
