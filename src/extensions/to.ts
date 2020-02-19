import numeral from 'numeral';
import { NotImplementedError } from '../errors';
import { is } from './is';
import { IMap } from './global';
export type BooleanOrFunc = boolean | (() => boolean);

export type StandardDataTypes = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function' | 'date' | 'array' | Date | [];

type StandardConversionFunction = (<T>(value: T) => T) | (<T>(value: unknown, defaultValue: T) => T) | ((value: unknown) => unknown);

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
      return is.string(defaultValueOrFormat) ? value.toString(defaultValueOrFormat) : value.toString('dd/MM/yyyy hh:mm:ss');
    }
    if (typeof (value) === 'string' && (allowEmpty || value.length > 0)) { return value; }
    return typeof (defaultValueOrFormat) === 'string' ? defaultValueOrFormat : '';
  }

  public boolean(value: BooleanOrFunc): boolean;
  public boolean(value: BooleanOrFunc, defaultValue: boolean): boolean;
  public boolean(value: unknown, defaultValue?: boolean): boolean {
    if (is.boolean(value)) { return value; }
    if (is.function(value)) { return this.boolean(value(), defaultValue); }
    return defaultValue;
  }

  public date(value: unknown): Date;
  public date(value: unknown, defaultValue: Date): Date;
  public date(value: unknown, defaultValue?: Date): Date {
    if (!(defaultValue instanceof Date)) { defaultValue = undefined; }
    if (is.date(value)) { return value; }
    if (is.number(value)) { return new Date(value); }
    if (is.not.empty(value)) { return Date.parse(value); }
    return defaultValue;
  }

  public number(value: unknown, defaultValue?: number): number {
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

}

export const to = new To();

const standardDataTypesMapping: IMap<StandardConversionFunction> = {
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
