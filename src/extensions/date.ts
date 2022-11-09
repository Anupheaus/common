/* eslint-disable max-classes-per-file */
import './object';
import { DateTime } from 'luxon';

type AddUnits = 'days' | 'hours' | 'minutes' | 'seconds';

declare global {
  interface Date extends DateExtensions { }
  interface DateConstructor extends DateConstructorExtensions { }
}

class DateExtensions {

  // public relationToNow(): string;
  // public relationToNow(template: string): string;
  // public relationToNow(this: Date, template = '{0}'): string {
  //   const getValue = () => {
  //     const time = this.getTime();
  //     const currentDate = new Date();
  //     const currentTime = currentDate.getTime();
  //     const yesterday = currentDate.add(-1, 'days');
  //     const secs = Math.floor(currentTime - time / 1000);
  //     const mins = Math.floor(secs / 60);
  //     const hours = Math.floor(mins / 60);
  //     if (secs < 60) { return 'just now'; }
  //     if (mins < 10) { return `${mins} minute${mins > 1 ? 's' : ''} ago`; }
  //     if (mins < 10) { return `${mins} minute${mins > 1 ? 's' : ''} ago`; }
  //     if (hours <= 24 && this.getDate() === currentDate.getDate()) { return `today at ${this.toString('h:mm tt')}`; }
  //     if (hours <= 48 && this.getDate() === yesterday.getDate()) { return `yesterday at ${this.toString('h:mm tt')}`; }
  //     return `on ${this.toString('dd/MM/yyyy')} at ${this.toString('h:mm tt')}`;
  //   };
  //   return template.replace(/\{0\}/gi, getValue());
  // }

  public clone(): Date;
  public clone(this: Date): Date {
    return new Date(this);
  }

  public add(value: number, unit: AddUnits): Date;
  public add(this: Date, value: number, unit: AddUnits): Date {
    value = parseInt(`${value}`);
    value = (() => {
      switch (unit) {
        case 'days': return value * 24 * 60 * 60 * 1000;
        case 'hours': return value * 60 * 60 * 1000;
        case 'minutes': return value * 60 * 1000;
        case 'seconds': return value * 1000;
      }
    })();
    const newDate = this.clone();
    newDate.setTime(newDate.getTime() + value);
    return newDate;
  }

  public format(): string;
  public format(format: string): string;
  public format(this: Date, format?: string): string {
    const dateTime = DateTime.fromJSDate(this);
    return format != null ? dateTime.toFormat(format) : dateTime.toISO();
  }

}

class DateConstructorExtensions {

  public timeTaken(epoch: number): number;
  public timeTaken(date: Date): number;
  public timeTaken(epochOrDate: number | Date): number {
    if (epochOrDate instanceof Date) return Date.timeTaken(epochOrDate.getTime());
    if (typeof (epochOrDate) === 'number') return Date.now() - epochOrDate;
    throw new Error('The epoch time or date you provided to timeTaken was invalid.');
  }

  public format(epoch: number): string;
  public format(epoch: number, format: string): string;
  public format(date: Date): string;
  public format(date: Date, format: string): string;
  public format(epochOrDate: number | Date, format = 'isoDateTime'): string {
    if (epochOrDate instanceof Date) return epochOrDate.format(format);
    if (typeof (epochOrDate) === 'number') return (new Date(epochOrDate)).format(format);
    throw new Error('The epoch time or date you provided to format was invalid.');
  }

}

Object.extendPrototype(Date.prototype, DateExtensions.prototype);
Object.extendPrototype(Date, DateConstructorExtensions.prototype);
