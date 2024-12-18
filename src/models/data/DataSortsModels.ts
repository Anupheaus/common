import { is, type AnyObject } from '../../extensions';

export type DataSortDirection = 'asc' | 'desc';

export type StrictDataSort<T extends AnyObject = AnyObject> = [keyof T, DataSortDirection];

export type DataSort<T extends AnyObject = AnyObject> = StrictDataSort<T> | keyof T;

export type DataSorts<T extends AnyObject = AnyObject> = (DataSort<T>[]) | keyof T;

export namespace DataSorts {
  export function toArray<T extends AnyObject = AnyObject>(sorts?: DataSorts<T>): StrictDataSort<T>[] {
    if (sorts == null) return [];
    if (is.array(sorts)) return sorts.map(sort => is.array(sort) ? sort : [sort, 'asc']);
    return [[sorts, 'asc']];
  }
}

export namespace DataSortDirections {
  export function toCSSClass(direction: DataSortDirection): string {
    switch (direction) {
      case 'asc': return 'is-sorted-asc';
      case 'desc': return 'is-sorted-desc';
      default: return '';
    }
  }

  export function moveToNextState(direction: DataSortDirection): DataSortDirection | undefined {
    if (direction === 'asc') return 'desc';
    if (direction === 'desc') return undefined;
    return 'asc';
  }

}
