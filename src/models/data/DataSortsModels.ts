export type DataSortDirection = 'ASC' | 'DESC';

export type DataSort<T extends {} = {}> = {
  field: keyof T;
  direction: DataSortDirection;
};

export type DataSorts<T extends {} = {}> = DataSort<T>[];

export const DataSortDirections = {
  toCSSClass(direction: DataSortDirection): string {
    switch (direction) {
      case 'ASC': return 'is-sorted-asc';
      case 'DESC': return 'is-sorted-desc';
      default: return '';
    }
  },

  moveToNextState(direction: DataSortDirection): DataSortDirection | undefined {
    if (direction === 'ASC') return 'DESC';
    if (direction === 'DESC') return undefined;
    return 'ASC';
  },
};
