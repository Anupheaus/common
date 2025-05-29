/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable max-classes-per-file */
import type { ProxyOf } from '../proxy';
import { isProxySymbol } from '../proxy/privateModels';
import type { NotPromise, AnyObject, AnyFunction, ErrorLike, Record } from './global';
import { isEqual } from './is.equal';
import type { ListItem } from './ListItem';

function parseArguments<R, T = unknown>(value: T, result: boolean, type?: string, defaultValue?: () => T | R, isIncorrectType?: () => T | R,
  isCorrectType?: (value: T) => T | R): T | R | boolean {
  if (defaultValue === undefined) { return result && (type === undefined || typeof (value) === type); }
  isIncorrectType = isIncorrectType || defaultValue;
  isCorrectType = isCorrectType || (v => v);
  if (result && (type === undefined || typeof (result) === type)) { return isCorrectType(value); }
  return isIncorrectType();
}

const isoDateRegex = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;

export class Is {

  public get not() { return isNot; } // eslint-disable-line @typescript-eslint/no-use-before-define

  public null(value: unknown): value is null | undefined;
  public null<T>(value: unknown, defaultValue: () => T): T;
  public null<T>(value: T, defaultValue?: () => T): T | boolean {
    if (typeof (defaultValue) === 'number') { defaultValue = undefined; } // we are being used in a loop
    return parseArguments(value, value == null, undefined, defaultValue, () => value, () => defaultValue ? defaultValue() : true);
  }

  public function(value: unknown): value is Function;
  public function<T extends AnyFunction>(value: T): value is T;
  public function(value: unknown): value is AnyFunction {
    return typeof (value) === 'function' && !value.toString().startsWith('class ');
  }

  public class<T extends Function>(value: T): value is T;
  public class<T extends Function = Function>(value: unknown): value is T;
  public class<T>(value: unknown): value is T {
    return typeof (value) === 'function' && value.toString().startsWith('class ');
  }

  public prototype<T extends Function>(value: T | unknown): value is T {
    if (is.object(value) && typeof (value.constructor) === 'function' && Object.getOwnPropertyNames(value).includes('constructor')) return true;
    if (is.class(value)) return true;
    return false;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public array(value: unknown | unknown[]): value is any[];
  public array<T>(value: T | T[]): value is T[];
  public array<T>(value: unknown): value is T[];
  public array(value: unknown): value is [] {
    return value instanceof Array;
  }

  public promise<T>(value: Promise<T>): value is Promise<T>;
  public promise<T = unknown>(value: unknown): value is Promise<NotPromise<T>>;
  public promise(value: unknown): value is Promise<unknown> {
    if (is.null(value)) { return false; }
    if (value instanceof Promise) { return true; }
    const result = value as Promise<unknown>;
    return is.function(result.catch) && is.function(result.then);
  }

  public guid(value: unknown): value is string {
    if (!is.string(value)) return false;
    return /^[{(]?[0-9A-F]{8}[-]?(?:[0-9A-F]{4}[-]?){3}[0-9A-F]{12}[)}]?$/gmi.test(value);
  }

  public production() {
    return process.env.NODE_ENV === 'production';
  }

  public keyValuePair(value: unknown): value is { key: unknown; value: unknown; } {
    if (!is.object(value)) { return false; }
    return Object.prototype.hasOwnProperty.call(value, 'key') && Object.prototype.hasOwnProperty.call(value, 'value');
  }

  public object<T extends AnyObject>(value: T): value is T;
  public object<T extends AnyObject = AnyObject>(value: unknown): value is T;
  public object(value: unknown): value is AnyObject {
    return typeof (value) === 'object' && !this.array(value) && !this.null(value) && !this.date(value);
  }

  public plainObject<T extends AnyObject>(value: T): value is T;
  public plainObject<T extends AnyObject = AnyObject>(value: unknown): value is T;
  public plainObject(value: unknown): value is AnyObject {
    if (typeof (value) !== 'object' || value === null) { return false; }
    if (is.function(Object.getPrototypeOf)) {
      const proto = Object.getPrototypeOf(value);
      return proto === Object.prototype || proto === null;
    }
    return Object.prototype.toString.call(value) === '[object Object]';
  }

  public record<T extends Record>(value: T): value is T;
  public record(value: unknown): value is Record;
  public record(this: Is, value: unknown): value is Record {
    return this.plainObject(value) && Reflect.has(value, 'id');
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

  public empty<T extends string | number | null | void | undefined>(value: T): value is Exclude<T, string | number> {
    return !((typeof (value) === 'string' && value.trim().length > 0) || (typeof (value) === 'number' && !isNaN(value) && value !== 0));
  }

  /**
   * Checks whether or not the value is a string and if it is then whether or not it is also zero length.  If true, the value is either not a string 
   * or is a string but is zero length.
   * @param {string} value The value to be tested.
   * @returns {boolean} True if the value is not a string or is zero length.
   */
  public blank<T extends string | null | void | undefined>(value: T): value is Exclude<T, string> {
    return typeof (value) !== 'string' || value.trim().length === 0;
  }

  public errorLike(value: unknown): value is ErrorLike {
    if (value instanceof Error) { return true; }
    if (!is.plainObject(value)) { return false; }
    return is.not.blank(value['@error']);
  }

  public number(value: unknown): value is number {
    return typeof (value) === 'number' && !isNaN(value);
  }

  public numeric(value: string | undefined): boolean {
    if (value == null || is.blank(value)) return false;
    return /^-?\d+\.?\d*$/.test(value);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public enum(value: any, enumDefinition: object): boolean {
    const keys = Reflect.ownKeys(enumDefinition);
    return value != null && keys.includes(value.toString());
  }

  public email(value: unknown): value is string {
    if (!is.string(value)) { return false; }
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  public phoneNumber(value: unknown): value is string {
    if (!is.string(value)) { return false; }
    // eslint-disable-next-line max-len
    return /^(?:(?:\(?(?:0(?:0|11)\)?[\s-]?\(?|\+)44\)?[\s-]?(?:\(?0\)?[\s-]?)?)|(?:\(?0))(?:(?:\d{5}\)?[\s-]?\d{4,5})|(?:\d{4}\)?[\s-]?(?:\d{5}|\d{3}[\s-]?\d{3}))|(?:\d{3}\)?[\s-]?\d{3}[\s-]?\d{3,4})|(?:\d{2}\)?[\s-]?\d{4}[\s-]?\d{4}))(?:[\s-]?(?:x|ext\.?|#)\d{3,4})?$/.test(value);
  }

  public instance<T extends object>(value: T | unknown): value is T {
    return !is.prototype(value) && is.object(value) && value.constructor.name !== 'Object';
  }

  public primitive<T extends string | number | boolean>(value: T | unknown): value is T {
    return is.not.null(value) && !is.object(value);
  }

  public deepEqual(value: unknown, other: unknown): boolean {
    return isEqual(value, other, false);
  }

  public shallowEqual(value: unknown, other: unknown): boolean {
    return isEqual(value, other, true);
  }

  public browser(): boolean {
    return (new Function('try {return this===window;}catch(e){ return false;}'))();
  }

  public node(): boolean {
    return (new Function('try {return this===global;}catch(e){return false;}'))();
  }

  /**
   * Determines if the value is a proxy.
   */
  public proxy<T>(value: T | unknown): value is ProxyOf<T> {
    if (value == null) return false;
    return (value as any)[isProxySymbol] === true;
  }

  /**
   * Test to see if this value is a valid ISO date string.
   * @param value The value to be tested.
   * @returns {boolean} Returns true if the value is a valid ISO date string.
   */
  public isISODateString(value: unknown): value is string {
    if (!is.string(value)) return false;
    return isoDateRegex.test(value);
  }

  public listItem(item: unknown): item is ListItem {
    if (!is.object(item)) { return false; }
    return is.not.blank(item['id']) && Reflect.has(item, 'text');
  }

}

export class IsNot {

  public null<T>(value: T): value is Exclude<T, null | undefined>;
  public null<T>(value: unknown, defaultValue: () => T): T;
  public null<T>(value: T, defaultValue?: () => T): T | boolean {
    if (typeof (defaultValue) === 'number') { defaultValue = undefined; } // we are being used in a loop
    return parseArguments(value, value != null, undefined, defaultValue, () => defaultValue ? defaultValue() : false, () => value);
  }

  public array<T>(value: T | unknown[]): value is T {
    return !(value instanceof Array);
  }

  // public allNull<T>(...values: (() => T)[]): T | undefined {
  //   for (const delegate of values) {
  //     if (!is.function(delegate)) { continue; }
  //     try {
  //       const value = delegate();
  //       if (value == null) { continue; }
  //       return value;
  //     } catch {
  //       // ignore errors
  //     }
  //   }
  //   return undefined;
  // }

  public empty<T extends string | number | null | undefined | void>(value: T): value is Exclude<T, null | undefined | void>;
  public empty<T extends string | number | null | undefined | void>(value: T): value is Exclude<T, null | undefined | void> {
    return !is.empty(value);
  }

  public blank(value: unknown): value is string;
  public blank(...values: unknown[]): boolean;
  public blank(...values: unknown[]): boolean {
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
