import { is } from '../../extensions';
import type { DataFilter, DataFilterOperator, DataFilters, StrictDataFilter, StrictDataFilters } from './DataFilterModels';

function convertToStrictFilterArray<T extends {}>(filters: Exclude<DataFilter<T>, StrictDataFilter<T>>): StrictDataFilter<T>[] {
  return Object.entries(filters).map(([key, value]: [string, any]) => {
    const filter: { operator: DataFilterOperator; value: unknown; } = is.plainObject(value) && 'value' in value
      ? { operator: value.operator ?? 'equals', value: value.value }
      : { operator: 'equals', value };
    return {
      field: key,
      ...filter,
    } as StrictDataFilter<T>;
  });
}

function convertToStrict<T extends {}>(filters: DataFilters<T> | DataFilters<T>[] | undefined): (StrictDataFilters<T> | StrictDataFilter<T>)[] {
  if (filters == null) return [];
  if ('condition' in filters || 'filters' in filters) return [{ condition: filters.condition ?? 'AND', filters: convertToStrict(filters.filters) }];
  if ('field' in filters && 'operator' in filters && 'value' in filters) return [filters];
  if (filters instanceof Array) return filters.map(filter => convertToStrict(filter)).flatten();
  return convertToStrictFilterArray(filters as Exclude<DataFilter<T>, StrictDataFilter<T>>);
}

export function convertToStrictFilters<T extends {}>(filters: DataFilters<T> | undefined): StrictDataFilters<T> {
  if (filters == null) return { condition: 'AND', filters: [] };
  if ('condition' in filters || 'filters' in filters) return { condition: filters.condition ?? 'AND', filters: convertToStrict(filters.filters) };
  if ('field' in filters && 'operator' in filters && 'value' in filters) return { condition: 'AND', filters: convertToStrict(filters) };
  if (filters instanceof Array) return { condition: 'AND', filters: convertToStrict(filters) };
  if (is.plainObject(filters)) return { condition: 'AND', filters: convertToStrict(filters) };
  return { condition: 'AND', filters: [] };
}
