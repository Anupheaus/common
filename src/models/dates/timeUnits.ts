import * as moment from 'moment';
import { InternalError } from '../../errors';

export enum TimeUnits {
  Day,
  Week,
  Month,
  Quarter,
  Year,
}

export namespace TimeUnits {
  export function toMomentUnits(timeUnit: TimeUnits): moment.unitOfTime.DurationConstructor {
    switch (timeUnit) {
      case TimeUnits.Day: return 'days';
      case TimeUnits.Week: return 'weeks';
      case TimeUnits.Month: return 'months';
      case TimeUnits.Quarter: return 'quarters';
      case TimeUnits.Year: return 'years';
      default: throw new InternalError('The time unit provided was not recognised.', { timeUnit });
    }
  }
}
