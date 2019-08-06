import * as numeral from 'numeral';
import { is } from './is';
export type BooleanOrFunc = boolean | (() => boolean);

class To {

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
    if (!is.stringAndNotEmpty(value)) { return defaultValue; }
    const convertedValue = Date.parse(value);
    if (!(convertedValue as unknown instanceof Date)) { return defaultValue; }
    return convertedValue;
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

  public array<T>(value: T[]): T[] {
    return is.array(value, () => new Array<T>());
  }

  public string(value: number, format: string): string {
    return numeral(value).format(format);
  }

}

export const to = new To();
