import { is } from '../../extensions';
import { DataFilter, DataFilterGroup, DataFilterGroupCondition, DataFilterMap, DataFilterMapValue, DataFilterOperators, DataFilters, StrictDataFilter, StrictDataFilters } from './filters';

function isSingleFilter<T extends {}>(filter: DataFilters<T>): filter is DataFilter<T> {
  if (is.null(filter) || is.array(filter)) return false;
  if ('field' in filter) return true;
  return false;
}

function convertToStrictFilter<T extends {}>(filter: DataFilter<T>): StrictDataFilter<T> | undefined {
  if (!isSingleFilter(filter)) return undefined;
  return {
    field: filter.field,
    operator: filter.operator,
    value: filter.value,
  };
}

function extractGroups<T extends {}>(anyFilters: DataFilters<T> | DataFilters<T>[] | undefined): StrictDataFilters<T>[] {
  if (is.null(anyFilters)) return [];
  if (!is.array(anyFilters)) {
    if ('condition' in anyFilters || 'filters' in anyFilters) return [convertFiltersToStrict(anyFilters)];
    return [];
  }
  return anyFilters.map(anyFilter => extractGroups(anyFilter)).flatten();
}

function extractFilters<T extends {}>(anyFilters: DataFilters<T> | DataFilters<T>[] | undefined): StrictDataFilter<T>[] {
  if (is.null(anyFilters)) return [];
  if (!is.array(anyFilters)) {
    if ('condition' in anyFilters || 'filters' in anyFilters) return [];
    if ('field' in anyFilters) return [anyFilters];
    return Object.entries(anyFilters).cast<[keyof T, DataFilterMap<T>[keyof T]]>().map(([key, value]): StrictDataFilter<T> | undefined => {
      if (typeof (value) === 'string') return { field: key, operator: 'equals', value: value as T[keyof T] };
      if (is.plainObject<DataFilterMapValue<T, keyof T>>(value)) return { field: key, operator: value.operator ?? '=', value: value.value };
    }).removeNull();
  }
  return anyFilters.map(anyFilter => extractGroups(anyFilter)).flatten();
}

function convertFiltersToStrict<T extends {}>(filters: DataFilters<T>): StrictDataFilters<T> {
  if ('condition' in filters && 'groups' in filters && 'filters' in filters) return filters;
  if ('filters' in filters) return { condition: filters.condition ?? 'AND', groups: extractGroups(filters.filters), filters: extractFilters(filters.filters) };
  // if(isSingleFilter(filters)) return { condition: 'AND', groups: [], filters: [convertToStrictFilter(filters)].removeNull() };
  // if(isMappedFilters(filters)) return { condition: 'AND', groups: [], filters: convertMappedFiltersToStrict(filters) };
  if (is.array(filters)) return convertFiltersToStrict({ condition: 'AND', filters });
}