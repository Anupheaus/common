import { pluralize, singularize } from 'inflection';
import { NotImplementedError } from '../../errors/NotImplementedError';
import { MapOf } from '../global';
import { is } from '../is';
import numeral from 'numeral';
import { ProxyApi, ProxyOf, ProxyOfApi, createProxyOf } from '../../proxy';
import { getProxyApiFrom } from '../../proxy/getProxyApiFrom';
import { Error, InternalError } from '../../errors';
import { deserialise, serialise } from './serialisation';

export type BooleanOrFunc = boolean | (() => boolean);

export type StandardDataTypes = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function' | 'date' | 'array' | Date | [];

class To {

  public string(value: unknown): string;
  public string(value: unknown, allowEmpty: boolean): string;
  public string(value: number, format: string): string;
  public string(value: Date, format: string): string;
  public string(value: unknown, defaultValue: string): string;
  public string(value: unknown, defaultValue: string, allowEmpty: boolean): string;
  public string(this: string, value: unknown, defaultValueOrFormatOrAllowEmpty?: string | boolean, allowEmpty = true): string {
    allowEmpty = typeof (defaultValueOrFormatOrAllowEmpty) === 'boolean' ? defaultValueOrFormatOrAllowEmpty : allowEmpty;
    const defaultValueOrFormat = typeof (defaultValueOrFormatOrAllowEmpty) === 'string' ? defaultValueOrFormatOrAllowEmpty : undefined;
    if (is.number(value)) {
      return is.string(defaultValueOrFormat) ? numeral(value).format(defaultValueOrFormat) : value.toString();
    } else if (is.date(value)) {
      return is.string(defaultValueOrFormat) ? value.format(defaultValueOrFormat) : value.format('dd/MM/yyyy hh:mm:ss');
    }
    if (typeof (value) === 'string' && (allowEmpty || value.length > 0)) { return value; }
    return typeof (defaultValueOrFormat) === 'string' ? defaultValueOrFormat : '';
  }

  public boolean(value: BooleanOrFunc): boolean;
  public boolean(value: BooleanOrFunc, defaultValue: boolean): boolean;
  public boolean(value: unknown, defaultValue: boolean): boolean;
  public boolean(value: unknown, defaultValue?: boolean): boolean {
    if (is.boolean(value)) return value;
    if (is.number(value)) return value !== 0;
    if (is.string(value)) {
      if (is.numeric(value)) return this.boolean(to.number(value, 0), defaultValue ?? false);
      if (value.toLowerCase().trim() === 'true') return true;
    }
    if (is.function(value)) { return defaultValue != null ? this.boolean(value(), defaultValue) : this.boolean(value()); }
    return defaultValue ?? false;
  }

  public date(value: unknown): Date;
  public date(value: unknown, defaultValue: Date): Date;
  public date(value: unknown, defaultValue?: Date): Date {
    if (!(defaultValue instanceof Date)) { defaultValue = undefined; }
    if (is.date(value)) { return value; }
    if (is.number(value)) { return new Date(value); }
    if (is.not.empty(value)) { return new Date(Date.parse(value)); }
    return defaultValue ?? new Date();
  }

  public number(value: unknown): number | undefined;
  public number(value: unknown, defaultValue: number): number;
  public number(value: unknown, defaultValue?: number): number | undefined {
    if (typeof (value) === 'number') { return value; }
    if (typeof (value) === 'string') {
      const intValue = parseInt(value, 0);
      if (isNaN(intValue)) { return defaultValue; }
      const floatValue = parseFloat(value);
      if (intValue === floatValue) { return intValue; }
      return floatValue;
    }
    return defaultValue;
  }

  public function<T extends Function>(value: T): T;
  public function<T extends Function>(value: T, defaultValue: T): T;
  public function(value: unknown): Function;
  public function<T extends Function>(value: unknown, defaultValue: T): T;
  public function<T extends Function>(value: unknown, defaultValue?: T): T {
    if (typeof (value) === 'function') { return value as T; }
    return defaultValue || (() => void 0) as unknown as T;
  }

  public object<T extends Object>(value: T): T;
  public object<T extends Object>(value: T, defaultValue: T): T;
  public object(value: unknown): Object;
  public object<T extends Object>(value: unknown, defaultValue: T): T;
  public object<T extends Object>(value: unknown, defaultValue?: T): T {
    if (typeof (value) === 'object' && value != null) { return value as T; }
    return defaultValue || {} as T;
  }

  public proxy<T extends Object>(target: T): ProxyOfApi<T> {
    return createProxyOf(target);
  }

  public proxyApi<T>(target: ProxyOf<T>): ProxyApi<T> {
    const api = getProxyApiFrom(target);
    if (api == null) throw new InternalError('Unable to get proxy api from target');
    return api;
  }

  public array<T>(value: T[]): T[] {
    return is.array(value) ? value : new Array<T>();
  }

  public type(value: unknown): StandardDataTypes;
  public type<T>(typeName: StandardDataTypes, value: unknown): T;
  public type<T>(typeName: StandardDataTypes, value: unknown, defaultValue: T): T;
  public type(typeName: StandardDataTypes, value: unknown): unknown;
  public type(typeName: StandardDataTypes, value: unknown, defaultValue: unknown): unknown;
  public type<T>(typeNameOrValue: StandardDataTypes | unknown, value?: unknown, defaultValue?: T): T | StandardDataTypes {
    if (arguments.length === 1) {
      value = typeNameOrValue;
      if (value instanceof Date) { return 'date'; }
      if (value instanceof Array) { return 'array'; }
      return typeof (value);
    } else {
      const typeNameAsString = typeNameOrValue instanceof Date ? 'date' : typeNameOrValue instanceof Array ? 'array' : typeNameOrValue as string;
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      const mappingFunction: Function = standardDataTypesMapping[typeNameAsString];
      return mappingFunction(value, defaultValue);
    }
  }

  public switchMap<T extends string | number, R>(value: T, map: Partial<Record<T, R>> & { '*': R; }): R {
    return map[value] ?? map['*'];
  }

  public plural(value: string, count: number): string {
    if (count === 1) return singularize(value);
    return pluralize(value);
  }

  public error(value: unknown): Error | undefined {
    if (value instanceof Error) return value;
    if (value instanceof globalThis.Error || is.errorLike(value)) return new Error(value);
    return undefined;
  }

  public serialise(value: unknown, replacer?: (key: string, value: unknown) => unknown): string {
    return serialise(value, replacer);
  }

  public deserialise<T = unknown>(value: unknown, reviver?: (key: string, value: unknown) => unknown): T {
    return deserialise(value, reviver) as T;
  }

}

export const to = new To();

const standardDataTypesMapping: MapOf<Function> = {
  'string': to.string,
  'function': to.function,
  'object': to.object,
  'boolean': to.boolean,
  'date': to.date,
  'array': to.array,
  'number': to.number,
  'bigint': to.number,
  'symbol': () => { throw new NotImplementedError('Unable to convert any value to a symbol type.'); },
};
