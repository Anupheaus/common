import * as moment from 'moment';
import 'moment/locale/en-gb';
import { InternalError } from '../errors';
import { TimeUnits } from '../models';
import './object';

moment.locale('en-gb');

export { moment };

declare global {

    interface IDateExtents {
        from: number;
        to: number;
    }

    interface IDatePeriod {
        from: number;
        to: number;
        fraction?: number;
    }

    interface IFromPeriodsResult {
        joinedPeriods: IDatePeriod[];
        activePeriods: IDatePeriod[];
        inactivePeriods: IDatePeriod[];
        extents: IDateExtents;
    }

    // tslint:disable-next-line:interface-name
    interface DateConstructor {
        periods: {
            from(activePeriods: IDatePeriod[]): IFromPeriodsResult;
            from(activePeriods: IDatePeriod[], toTimeUnits: TimeUnits): IFromPeriodsResult;
            extents(periods: IDatePeriod[]): IDateExtents;
            doOverlap(period1: IDatePeriod, period2: IDatePeriod): boolean;
        };
        random(): Date;
        random(from: Date): Date;
        random(from: Date, to: Date): Date;
        min(...dates: Date[]): Date;
        toNumber(date: string): number;
        format(date: number): string;
        hasExpired(date: number): boolean;
        createExpiry(minutes: number): number;
        timeTaken(timeStarted: number): number;
        timeSince(time: number, unit: moment.unitOfTime.Diff): number;
    }

    // tslint:disable-next-line:interface-name
    interface Date {
        relationToNow(template?: string): string;
    }

}

Object.addMethods(Date, [

    function random(this: Date, start?: Date, end?: Date) {
        if (!(start instanceof Date)) { throw new InternalError('The start value provided to this function was not a valid date.', { start }); }
        if (!(end instanceof Date)) { throw new InternalError('The start value provided to this function was not a valid date.', { end }); }
        start = start || new Date(2010, 0, 1);
        end = end || new Date();
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    },

    function min(this: Date, ...dates: Date[]): Date {
        if (dates.length === 0) { return new Date(0); }
        let earliestDate = dates[0];
        dates.forEach(date => {
            if (Date.compare(date, earliestDate) < 0) { earliestDate = date; }
        });
        return earliestDate;
    },

    function toNumber(this: Date, date: string): number {
        const actualDate = new Date(date);
        return actualDate.getTime();
    },

    function format(this: Date, date: number): string {
        return (new Date(date)).toString('dd/MM/yyyy HH:mm:ss');
    },

    function hasExpired(this: Date, date: number): boolean {
        return typeof (date) !== 'number' || date < Date.now();
    },

    function createExpiry(this: Date, minutes: number): number {
        return (new Date()).addMinutes(minutes).getTime();
    },

    function timeTaken(this: Date, timeStarted: number): number {
        return Date.now() - timeStarted;
    },

    function timeSince(this: Date, time: number, unitOfTime: moment.unitOfTime.Diff): number {
        return moment(Date.now()).diff(time, unitOfTime);
    },

]);

Object.addMethods(Date.prototype, [

    function relationToNow(this: Date, template: string = '{0}'): string {
        const getValue = () => {
            const time = this.getTime();
            const currentDate = new Date();
            const currentTime = currentDate.getTime();
            const yesterday = new Date(currentDate.setDate(currentDate.getDate() - 1));
            const secs = Math.floor(currentTime - time / 1000);
            const mins = Math.floor(secs / 60);
            const hours = Math.floor(mins / 60);
            if (secs < 60) { return 'just now'; }
            if (mins < 10) { return `${mins} minute${mins > 1 ? 's' : ''} ago`; }
            if (mins < 10) { return `${mins} minute${mins > 1 ? 's' : ''} ago`; }
            if (hours <= 24 && this.getDate() === currentDate.getDate()) { return `today at ${this.toString('h:mm tt')}`; }
            if (hours <= 48 && this.getDate() === yesterday.getDate()) { return `yesterday at ${this.toString('h:mm tt')}`; }
            return `on ${this.toString('dd/MM/yyyy')} at ${this.toString('h:mm tt')}`;
        };
        return template.replace(/\{0\}/gi, getValue());
    },

]);

if (!Date.periods) {

    function applyFractionTo(period: IDatePeriod, timeUnit: TimeUnits): void {
        const fromPeriod = moment(period.from);
        const endOfFullPeriod = fromPeriod.clone().add(1, TimeUnits.toMomentUnits(timeUnit)).valueOf();
        if (endOfFullPeriod === period.to) { return; }
        const fullPeriod = endOfFullPeriod - period.from;
        const thisPeriod = period.to - period.from;
        period.fraction = thisPeriod / fullPeriod;
    }

    function splitPeriods(periods: IDatePeriod[], toTimeUnits: TimeUnits): IDatePeriod[] {
        const timeUnit = TimeUnits.toMomentUnits(toTimeUnits);
        return periods
            .reduce((newPeriods, period) => {
                const absFrom = moment(period.from);
                const absTo = moment(period.to);
                const fromPeriod = absFrom.clone().startOf(timeUnit);
                const to = absTo.clone().startOf(timeUnit);
                if (to < absTo) { to.add(1, timeUnit); }
                const length = to.diff(fromPeriod, timeUnit, true);
                const first: IDatePeriod = { from: absFrom.valueOf(), to: fromPeriod.clone().add(1, timeUnit).valueOf(), fraction: 1 };
                const last: IDatePeriod = { from: to.clone().add(-1, timeUnit).valueOf(), to: absTo.valueOf(), fraction: 1 };
                applyFractionTo(first, toTimeUnits);
                applyFractionTo(last, toTimeUnits);
                const middle = length < 2 ? [] : Array.ofSize(length - 2)
                    .map((_ignore, index): IDatePeriod => ({
                        from: fromPeriod.clone().add(index + 1, timeUnit).valueOf(),
                        to: fromPeriod.clone().add(index + 2, timeUnit).valueOf(),
                        fraction: 1,
                    }));
                return newPeriods.concat(first, ...middle, last);
            }, []);
    }

    function extents(periods: IDatePeriod[]): IDateExtents {
        const fromPeriod = moment(Math.min(...periods.map(period => period.from))).valueOf();
        const toPeriod = moment(Math.max(...periods.map(period => period.to))).valueOf();
        return { from: fromPeriod, to: toPeriod };
    }

    function validatePeriod(period: IDatePeriod): IDatePeriod {
        return {
            from: Math.min(period.from, period.to),
            to: Math.max(period.from, period.to),
            fraction: typeof (period.fraction) === 'number' ? period.fraction : 1,
        };
    }

    function from(activePeriods: IDatePeriod[], toTimeUnits?: TimeUnits): IFromPeriodsResult {
        activePeriods = activePeriods.map(validatePeriod).orderBy(period => period.from);
        const extentsPeriod = Date.periods.extents(activePeriods);
        let joinedPeriods: IDatePeriod[] = [];
        let fromPeriod = extentsPeriod.from;
        let toPeriod = fromPeriod;
        activePeriods.forEach((period, index) => {
            if (period.from <= toPeriod) {
                if (period.to > toPeriod) { toPeriod = period.to; }
                if (index === activePeriods.length - 1) { joinedPeriods.push({ from: fromPeriod, to: toPeriod, fraction: 1 }); }
            } else {
                joinedPeriods.push({ from: fromPeriod, to: toPeriod, fraction: 1 });
                fromPeriod = period.from;
                toPeriod = period.to;
            }
        });
        let inactivePeriods = joinedPeriods.reduce((inactive, period, index) => {
            if (index === 0) { return inactive; }
            return inactive.concat({ from: joinedPeriods[index - 1].to, to: period.from, fraction: 1 } as IDatePeriod);
        }, []);

        if (toTimeUnits) {
            activePeriods = splitPeriods(joinedPeriods, toTimeUnits);
            inactivePeriods = splitPeriods(inactivePeriods, toTimeUnits);
        }

        activePeriods = activePeriods.orderBy(period => period.from);
        inactivePeriods = inactivePeriods.orderBy(period => period.from);
        joinedPeriods = joinedPeriods.orderBy(period => period.from);

        return {
            extents: extentsPeriod,
            joinedPeriods,
            activePeriods,
            inactivePeriods,
        };
    }

    function doOverlap(period1: IDatePeriod, period2: IDatePeriod): boolean {
        return period1.from <= period2.to && period1.to >= period2.from;
    }

    Date.periods = {
        extents,
        from,
        doOverlap,
    };
}
