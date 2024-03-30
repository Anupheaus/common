import { DateTime } from 'luxon';

export interface DateRange {
  from: DateTime<true>;
  to: DateTime<true>;
}