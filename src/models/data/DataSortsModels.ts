import { AnyObject } from '../../extensions';

export type DataSortDirection = 'asc' | 'desc';

export type DataSort<T extends AnyObject = AnyObject> = Record<keyof T, DataSortDirection>;

export type DataSorts<T extends AnyObject = AnyObject> = DataSort<T>[];

export const DataSortDirections = {
  toCSSClass(direction: DataSortDirection): string {
    switch (direction) {
      case 'asc': return 'is-sorted-asc';
      case 'desc': return 'is-sorted-desc';
      default: return '';
    }
  },

  moveToNextState(direction: DataSortDirection): DataSortDirection | undefined {
    if (direction === 'asc') return 'desc';
    if (direction === 'desc') return undefined;
    return 'asc';
  },
};
