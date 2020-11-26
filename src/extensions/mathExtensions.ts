import './object';
import { v4 as uuid } from 'uuid';


export class MathExtensions {

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
    return this.max(min, Math.min(max, value));
  }

  public roundTo(x: number, decimalPlaces: number): number;
  public roundTo(this: Math, x: number, decimalPlaces: number): number {
    return +(this.round(x + `e+${decimalPlaces}` as unknown as number) + `e-${decimalPlaces}`);
  }

  public toPercentage(value: number): number;
  public toPercentage(value: number, decimalPlaces: number): number;
  public toPercentage(this: Math, value: number, decimalPlaces = 1): number {
    return this.roundTo(value * 100, decimalPlaces);
  }

}
