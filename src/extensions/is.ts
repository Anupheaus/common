/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-classes-per-file */
import { IMap } from './global';
import { __values } from 'tslib';

function parseArguments<R, T = unknown>(value: T, result: boolean, type?: string, defaultValue?: () => T | R, isIncorrectType?: () => T | R,
  isCorrectType?: (value: T) => T | R): T | R | boolean {
  if (defaultValue === undefined) { return result && (type === undefined || typeof (value) === type); }
  isIncorrectType = isIncorrectType || defaultValue;
  isCorrectType = isCorrectType || (v => v);
  if (result && (type === undefined || typeof (result) === type)) { return isCorrectType(value); }
  return isIncorrectType();
}

class Is {

  public get not() { return isNot; } // eslint-disable-line @typescript-eslint/no-use-before-define

  public null(value: unknown): value is null;
  public null<T>(value: unknown, defaultValue: () => T): T;
  public null<T>(value: T, defaultValue?: () => T): T | boolean {
    if (typeof (defaultValue) === 'number') { defaultValue = undefined; } // we are being used in a loop
    return parseArguments(value, value == null, undefined, defaultValue, () => value, () => defaultValue ? defaultValue() : true);
  }

  public function<T extends Function>(value: unknown): value is T;
  public function(value: unknown): value is Function;
  public function<T extends Function>(value: unknown): value is T {
    return typeof (value) === 'function' && !value.toString().startsWith('class ');
  }

  public array<T>(value: T[]): value is T[];
  public array(value: unknown): value is [];
  public array<T>(value: T[]): value is T[] {
    return value instanceof Array;
  }

  public promise(value: unknown): value is Promise<unknown> {
    if (is.null(value)) { return false; }
    if (value instanceof Promise) { return true; }
    const result = value as Promise<unknown>;
    return is.function(result.catch) && is.function(result.then);
  }

  public keyValuePair(value: unknown): boolean {
    if (!is.object(value)) { return false; }
    return Object.prototype.hasOwnProperty.call(value, 'key') && Object.prototype.hasOwnProperty.call(value, 'value');
  }

  public object<T>(value: unknown): value is T;
  public object(value: unknown): value is object;
  public object(value: unknown): value is object {
    return typeof (value) === 'object' && value !== null;
  }

  public plainObject(value: unknown): value is object {
    if (typeof (value) !== 'object' || value === null) { return false; }
    if (is.function(Object.getPrototypeOf)) {
      const proto = Object.getPrototypeOf(value);
      return proto === Object.prototype || proto === null;
    }
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  public date(value: unknown): value is Date;
  public date(value: unknown, defaultValue: Date): Date;
  public date(value: unknown, defaultValue?: unknown): unknown {
    const result = value instanceof Date;
    if (is.null(defaultValue)) { return result; }
    if (result) { return value; }
    return defaultValue;
  }

  public boolean(value: unknown): value is boolean {
    return typeof (value) === 'boolean';
  }

  public string(value: unknown): value is string {
    return typeof (value) === 'string';
  }

  public empty(value: unknown): boolean {
    return !(is.string(value) && value.length > 0);
  }

  public error(value: IMap): value is Error {
    if (!is.object(value)) { return false; }
    if (value instanceof Error) { return true; }
    return is.not.empty(value['stack']) && is.not.empty(value['message']);
  }

  public number(value: unknown): value is number {
    return typeof (value) === 'number' && !isNaN(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public enum(value: any, enumDefinition: object): boolean {
    const keys = Reflect.ownKeys(enumDefinition);
    return value != null && keys.includes(value.toString());
  }

  public primitive<T extends string | number | boolean>(value: T): value is T {
    return !is.object(value);
  }

}

class IsNot {

  public null<T>(value: T): value is T;
  public null<T>(value: unknown, defaultValue: () => T): T;
  public null<T>(value: T, defaultValue?: () => T): T | boolean {
    if (typeof (defaultValue) === 'number') { defaultValue = undefined; } // we are being used in a loop
    return parseArguments(value, value != null, undefined, defaultValue, () => defaultValue ? defaultValue() : false, () => value);
  }

  public allNull<T>(...values: (() => T)[]): T | undefined {
    for (const delegate of values) {
      if (!is.function(delegate)) { continue; }
      try {
        const value = delegate();
        if (value == null) { continue; }
        return value;
      } catch {
        // ignore errors
      }
    }
    return undefined;
  }

  public empty(value: unknown): value is string;
  public empty(...values: unknown[]): boolean;
  public empty(...values: unknown[]): boolean {
    // check if being used in a array.filter (value, index, array)
    if (values.length === 3 && typeof (values[1]) === 'number' && values[2] instanceof Array) { values = [values[0]]; }
    return values.every(item => typeof (item) === 'string' && item.length > 0);
  }

  public object(value: unknown): boolean {
    return !is.object(value);
  }

}

const isNot = new IsNot();
export const is = new Is();