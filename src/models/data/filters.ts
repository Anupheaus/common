import { MapOf } from '../../extensions';
import { IdTextPair } from '../global';

interface DataFilterOperatorListItem extends IdTextPair {
  operatorSymbol: string;
  valueModification(value: unknown): unknown;
}

const { ids: filterOperatorIds, pairs: DataFilterOperatorPairs } = IdTextPair.as<DataFilterOperatorListItem>().create([
  { id: 'equals', text: 'is equal to', operatorSymbol: '=', valueModification: v => v },
  { id: 'notEquals', text: 'is not equal to', operatorSymbol: '!=', valueModification: v => v },
  { id: 'greaterThan', text: 'is greater than', operatorSymbol: '>', valueModification: v => v },
  { id: 'lessThan', text: 'is less than', operatorSymbol: '<', valueModification: v => v },
  { id: 'greaterThanOrEqualTo', text: 'is greater than or equal to', operatorSymbol: '>=', valueModification: v => v },
  { id: 'lessThanOrEqualTo', text: 'is less than or equal to', operatorSymbol: '<=', valueModification: v => v },
  { id: 'contains', text: 'contains', operatorSymbol: 'LIKE', valueModification: v => `%${v}%` },
] as const);

const DataFilterOperators = DataFilterOperatorPairs as (typeof DataFilterOperatorPairs & {
  getSymbolFor(operator: DataFilterOperator): string | undefined;
  applyValueModificationUsing(operator: DataFilterOperator, value: unknown): unknown;
});
DataFilterOperators.getSymbolFor = operator => DataFilterOperators.find(item => item.id === operator)?.operatorSymbol;
DataFilterOperators.applyValueModificationUsing = (operator, value) => DataFilterOperators.find(item => item.id === operator)?.valueModification(value) ?? value;

export type DataFilterOperator = typeof filterOperatorIds;
export { DataFilterOperators };

export interface StrictDataFilter<T extends {} = {}, K extends keyof T = keyof T> {
  field: K;
  operator: DataFilterOperator;
  value: T[K];
}

export type DataFilterMapValue<T extends {}, K extends keyof T> = { operator: DataFilterOperator; value: T[K]; };

export type DataFilterMap<T extends {}> = {
  [K in keyof T]?: T[K] | DataFilterMapValue<T, K>;
};

export type DataFilter<T extends {} = {}> = DataFilterMap<T> | StrictDataFilter<T, keyof T>;

export type DataFilterGroupCondition = 'AND' | 'OR';

export interface DataFilterGroup<T extends {} = {}> {
  condition?: DataFilterGroupCondition;
  filters?: DataFilters<T>[];
}

export type DataFilters<T extends {}> = DataFilter<T> | DataFilter<T>[] | DataFilterGroup<T>;

export interface StrictDataFilters<T extends {}> {
  condition: DataFilterGroupCondition;
  groups: StrictDataFilters<T>[];
  filters: StrictDataFilter<T>[];
}

export namespace DataFilters {

  export const convert = 

}
