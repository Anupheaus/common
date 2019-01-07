import { bind } from '../decorators/bind';
import { IMap } from './global';

class Is {

    public null(value: any): value is null;
    public null<T>(value: T, defaultValue: () => T): T;
    public null(value: any, defaultValue?: () => any): any {
        const isNull = value == null;
        if (defaultValue === undefined || !this.function(defaultValue)) { return isNull; }
        return isNull ? defaultValue() : value;
    }

    public notNull<T>(...values: (() => T)[]): T {
        for (const delegate of values) {
            if (!this.function(delegate)) { continue; }
            try {
                const value = delegate();
                if (value == null) { continue; }
                return value;
            } catch {
                // ignore errors
            }
        }
        return null;
    }

    public function(value: any): value is Function;
    public function<T>(value: any, defaultValue: T): T;
    @bind
    public function(value: any, defaultValue?: () => any): any {
        const result = typeof (value) === 'function';
        if (defaultValue === undefined) { return result; }
        return result ? value : this.function(defaultValue) ? defaultValue : null;
    }

    public array(value: any): value is any[];
    public array<T>(value: any, defaultValue: () => T[]): T[];
    public array<T>(value: any, defaultValue?: () => T[]): any {
        const result = value instanceof Array;
        if (!is.function(defaultValue)) { return result; }
        return result ? value : defaultValue();
    }

    public promise(value: any): value is Promise<any> {
        if (this.null(value)) { return false; }
        if (value instanceof Promise) { return true; }
        const result = value as Promise<any>;
        return this.function(result.catch) && this.function(result.then);
    }

    public keyValuePair(value: any): boolean {
        if (this.null(value)) { return false; }
        return !this.null(value.key) && value.value !== undefined;
    }

    public object(value: any): value is object {
        return typeof (value) === 'object' && value !== null;
    }

    public plainObject(value: any): value is object {
        if (typeof (value) !== 'object' || value === null) { return false; }
        if (this.function(Object.getPrototypeOf)) {
            const proto = Object.getPrototypeOf(value);
            return proto === Object.prototype || proto === null;
        }
        return Object.prototype.toString.call(value) === '[object Object]';
    }

    public date(value: any): value is Date;
    public date(value: any, defaultValue: Date): Date;
    public date(value: any, defaultValue?: any): any {
        const result = value instanceof Date;
        if (this.null(defaultValue)) { return result; }
        if (result) { return value; }
        return defaultValue;
    }

    public boolean(value: any): value is boolean;
    public boolean(value: any, defaultValue: boolean): boolean;
    public boolean(value: any, defaultValue?: boolean): boolean {
        if (defaultValue === undefined) { return typeof (value) === 'boolean'; }
        if (this.number(value)) { value = parseInt(value as any, 0); }
        if (typeof (value) === 'string') {
            value = value.toLowerCase();
            if (value === 'true' || value === 'yes') { return true; }
            if (value === 'false' || value === 'no') { return false; }
        }
        if (typeof (value) === 'boolean') { return value; }
        if (typeof (value) === 'number') { return value !== 0; }
        if (typeof (value) === 'object') { return value === true; }
        if (typeof (value) === 'function') { return this.boolean(value(), defaultValue); }
        return this.boolean(defaultValue) ? defaultValue : false;
    }

    public string(value: any): value is string;
    public string(value: any, defaultValue: string): string;
    public string(value: any, defaultValue: () => string): string;
    public string<T>(value: any, isString: (value: string) => T, notString: () => T): T;
    public string(value: any): any {
        const result = typeof (value) === 'string';
        return this.parseArguments(value, result, 'string', arguments);
    }

    public stringAndNotEmpty(value: any): value is string;
    public stringAndNotEmpty(value: any, defaultValue: string): string;
    public stringAndNotEmpty(value: any, defaultValue: () => string): string;
    public stringAndNotEmpty<T>(value: any, isStringAndNotEmpty: (value: string) => T, notString: () => T): T;
    @bind
    public stringAndNotEmpty(value: any): any {
        const result = typeof (value) === 'string' && (value as string).length > 0;
        return this.parseArguments(value, result, 'string', arguments);
    }

    public empty(value: string): boolean;
    public empty(value: string, defaultValue: string): string;
    public empty(value: string, defaultValue: () => string): string;
    public empty<T>(value: string, isEmpty: () => T, isNotEmpty: (value: string) => T): T;
    @bind
    public empty(...args: any[]): any {
        if (args.length === 3) { args = args.move(2, 1); }
        return !this.stringAndNotEmpty.apply(this, args);
    }

    public error(value: IMap): value is Error {
        if (value == null || typeof (value) !== 'object') { return false; }
        if (value instanceof Error) { return true; }
        return this.stringAndNotEmpty(value.stack) && this.stringAndNotEmpty(value.message);
    }

    public number(value: any): value is number;
    public number(value: any, defaultValue: number): number;
    public number(value: any, defaultValue: number, min: number, max: number): number;
    public number(value: any, defaultValue: () => number): number;
    public number<T>(value: any, isNumber: (value: number) => T, isNotNumber: () => T): T;
    public number(value: any): any {
        const min = arguments.length === 4 && this.number(arguments[2]) ? arguments[2] : 0;
        const max = arguments.length === 4 && this.number(arguments[3]) ? arguments[3] : 0;
        const result = typeof (value) === 'number' || !isNaN(parseFloat(value));
        let actualResult = this.parseArguments(value, result, 'number', arguments);
        if (this.boolean(actualResult)) { return actualResult; }
        actualResult = parseFloat(value) !== parseInt(value, 0) ? parseFloat(actualResult) : parseInt(actualResult, 0);
        if (arguments.length === 4 && this.number(max) && this.number(min) && max >= min) {
            if (actualResult < min) { actualResult = min; }
            if (actualResult > max) { actualResult = max; }
        }
        return actualResult;
    }

    public enum(value: any, enumDefinition: any): boolean;
    public enum<TEnum>(value: any, enumDefinition: any, defaultValue: TEnum): TEnum;
    public enum(value: any, enumDefinition: any, defaultValue: number = null): any {
        const keys = Reflect.ownKeys(enumDefinition);
        const result = !is.null(value) && keys.includes(value.toString());
        if (is.null(defaultValue)) { return result; }
        if (!is.number(value)) { value = enumDefinition[value]; } // Convert string value back to number
        return result ? value : defaultValue;
    }

    public primitive(value: any): value is string | number | boolean {
        return !this.object(value);
    }

    private parseArguments(value: any, result: boolean, type: string, args: IArguments): any {
        const defaultValueFunction = args.length === 2 && this.function(args[1]) ? args[1] : null;
        let defaultValue = args.length === 2 && typeof (args[1]) === type ? args[1] : null;
        const isCorrectTypeFunction = args.length === 3 && this.function(args[1]) ? args[1] : null;
        const isNotCorrectTypeFunction = args.length === 3 && this.function(args[2]) ? args[2] : null;
        if (result) { return !this.null(isCorrectTypeFunction) ? isCorrectTypeFunction(value) : args.length === 1 ? result : value; }
        if (!this.null(isNotCorrectTypeFunction)) { return isNotCorrectTypeFunction(); }
        if (!this.null(defaultValueFunction)) { defaultValue = defaultValueFunction(); }
        if (!this.null(defaultValue)) { return defaultValue; }
        return result;
    }

}

export let is = new Is();
