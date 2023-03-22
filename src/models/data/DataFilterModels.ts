import { ListItem, ListItems } from '../../extensions/ListItem';
import { convertToStrictFilters } from './DataFilterUtils';

interface DataFilterOperatorListItem extends ListItem {
  operatorSymbol: string;
}

const { ids: filterOperatorIds, pairs: DataFilterOperatorPairs } = ListItems.as<DataFilterOperatorListItem>().create([
  { id: 'equals', text: 'is equal to', operatorSymbol: '=', },
  { id: 'notEquals', text: 'is not equal to', operatorSymbol: '!=', },
  { id: 'greaterThan', text: 'is greater than', operatorSymbol: '>', },
  { id: 'lessThan', text: 'is less than', operatorSymbol: '<', },
  { id: 'greaterThanOrEqualTo', text: 'is greater than or equal to', operatorSymbol: '>=', valueModification: (v: unknown) => v },
  { id: 'lessThanOrEqualTo', text: 'is less than or equal to', operatorSymbol: '<=', valueModification: (v: unknown) => v },
  { id: 'contains', text: 'contains', operatorSymbol: 'LIKE', valueModification: (v: unknown) => `%${v}%` },
] as const);

const DataFilterOperators = DataFilterOperatorPairs as (typeof DataFilterOperatorPairs & {
  getSymbolFor(operator: DataFilterOperator): string | undefined;
});
DataFilterOperators.getSymbolFor = operator => DataFilterOperators.find(item => item.id === operator)?.operatorSymbol;

export type DataFilterOperator = typeof filterOperatorIds;
export { DataFilterOperators };

export interface StrictDataFilter<T extends {} = {}, K extends keyof T = keyof T> {
  field: K;
  operator: DataFilterOperator;
  value: T[K];
}

export type DataFilter<T extends {} = {}> = { [K in keyof T]?: T[K] | { operator: DataFilterOperator; value: T[K]; }; } | StrictDataFilter<T>;

export type DataFilterGroupCondition = 'AND' | 'OR';

export interface DataFilterGroup<T extends {} = {}> {
  condition?: DataFilterGroupCondition;
  filters?: DataFilters<T>[];
}

export type DataFilters<T extends {}> = DataFilter<T> | DataFilter<T>[] | DataFilterGroup<T>;

export namespace DataFilters {
  export const convertToStrict = convertToStrictFilters;
}

export interface StrictDataFilters<T extends {}> {
  condition: DataFilterGroupCondition;
  filters: (StrictDataFilters<T> | StrictDataFilter<T>)[];
}
