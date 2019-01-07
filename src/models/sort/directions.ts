export enum SortDirections {
  None,
  Ascending,
  Descending,
}

export namespace SortDirections {
  export function toCSSClass(direction: SortDirections): string {
    switch (direction) {
      case SortDirections.Ascending: return 'sorted-asc';
      case SortDirections.Descending: return 'sorted-desc';
      default: return '';
    }
  }

  export function toShortName(direction: SortDirections): string {
    switch (direction) {
      case SortDirections.Ascending: return 'Asc';
      case SortDirections.Descending: return 'Desc';
      default: return '';
    }
  }

  export function nextDirectionAfter(direction: SortDirections): SortDirections {
    return direction === 2 ? 0 : direction + 1;
  }
}
