import * as numeral from 'numeral';
import { is } from './is';
export type BooleanOrFunc = boolean | (() => boolean);

class To {

    public boolean(value: BooleanOrFunc): boolean;
    public boolean(value: BooleanOrFunc, defaultValue: boolean): boolean;
    public boolean(value: any, defaultValue?: boolean): boolean {
        if (is.boolean(value)) { return value; }
        if (is.function(value)) { return to.boolean(value(), defaultValue); }
        return defaultValue;
    }

    public date(value: any): Date;
    public date(value: any, defaultValue: Date): Date;
    public date(value: any, defaultValue?: Date): Date {
        if (!(defaultValue instanceof Date)) { defaultValue = undefined; }
        if (is.date(value)) { return value; }
        if (is.number(value)) { return new Date(value); }
        if (!is.stringAndNotEmpty(value)) { return defaultValue; }
        const convertedValue = Date.parse(value);
        if (!(convertedValue as any instanceof Date)) { return defaultValue; }
        return convertedValue as any;
    }

    public number(value: any, defaultValue?: number): number {
        const intValue = parseInt(value, 0);
        if (isNaN(intValue)) { return defaultValue; }
        const floatValue = parseFloat(value);
        if (intValue === floatValue) { return intValue; }
        return floatValue;
    }

    public array<T>(value: T[]): T[] {
        return is.array(value, () => new Array<T>());
    }

    public string(value: number, format: string): string {
        return numeral(value).format(format);
    }

}

export let to = new To();
