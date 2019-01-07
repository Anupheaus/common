import * as uuid from 'uuid/v4';
import './object';

const originalRound = Math.round;

class MathExtensions {

    public emptyId(): string;
    public emptyId(this: Math): string {
        return '00000000-0000-0000-0000-000000000000';
    }

    public uniqueId(): string;
    public uniqueId(this: Math): string {
        return uuid();
    }

    public between(value: number, min: number, max: number): number;
    public between(this: Math, value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    public round(x: number): number;
    public round(x: number, decimalPlaces: number): number;
    public round(this: Math, x: number, decimalPlaces?: number): number {
        if (decimalPlaces == null) { return originalRound(x); }
        // tslint:disable-next-line:prefer-template
        return +(originalRound(x + `e+${decimalPlaces}` as any) + `e-${decimalPlaces}`);
    }

}

declare global { export interface Math extends MathExtensions { } }
Object.extendPrototype(Math, MathExtensions.prototype);