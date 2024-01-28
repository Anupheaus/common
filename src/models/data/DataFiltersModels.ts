import { AnyObject, PrimitiveType } from '../../extensions';
import { ListItem, ListItems } from '../../extensions/ListItem';

export type DataFilterValueTypes = 'string' | 'number' | 'boolean' | 'date' | 'currency';

interface DataFilterOperatorListItem extends ListItem {
  acceptableTypes: DataFilterValueTypes[];
}

const { ids: filterOperatorIds, pairs: DataFilterOperatorPairs } = ListItems.as<DataFilterOperatorListItem>().create([
  { id: '$eq', text: 'is equal to', acceptableTypes: ['string', 'number', 'boolean', 'date', 'currency'] },
  { id: '$ne', text: 'is not equal to', acceptableTypes: ['string', 'number', 'boolean', 'date', 'currency'] },
  { id: '$gt', text: 'is greater than', acceptableTypes: ['number', 'date', 'currency'] },
  { id: '$lt', text: 'is less than', acceptableTypes: ['number', 'date', 'currency'] },
  { id: '$gte', text: 'is greater than or equal to', acceptableTypes: ['number', 'date', 'currency'] },
  { id: '$lte', text: 'is less than or equal to', acceptableTypes: ['number', 'date', 'currency'] },
  { id: '$like', text: 'contains', acceptableTypes: ['string'] },
  { id: '$beginsWith', text: 'begins with', acceptableTypes: ['string'] },
  { id: '$endsWith', text: 'ends with', acceptableTypes: ['string'] },
  { id: '$in', text: 'is one of', acceptableTypes: ['string', 'number', 'boolean', 'date', 'currency'] },
  { id: '$ni', text: 'is not one of', acceptableTypes: ['string', 'number', 'boolean', 'date', 'currency'] },
] as const);

export const DataFilterOperators = DataFilterOperatorPairs;
export type DataFilterOperator = typeof filterOperatorIds;

export namespace DataFilterOperator {
  export const singleValueKeys = ['$gt', '$lt', '$gte', '$lte', '$eq', '$ne', '$like', '$beginsWith', '$endsWith'] as const;
  export const multiValueKeys = ['$in', '$ni'] as const;
  export const allKeys = [...singleValueKeys, ...multiValueKeys] as const;
}

/* eslint-disable @typescript-eslint/indent */
type WhereClauseWrapper<ValueType> =
  ValueType extends PrimitiveType ? Partial<Record<typeof DataFilterOperator.singleValueKeys[number], ValueType> & Record<typeof DataFilterOperator.multiValueKeys[number], ValueType[]>>
  : ValueType extends AnyObject ? DataFilters<ValueType> : never;
/* eslint-enable @typescript-eslint/indent */

type DataObjectTypeFilters<ObjectType extends AnyObject = AnyObject> = {
  [Key in keyof ObjectType]?: ObjectType[Key] | WhereClauseWrapper<ObjectType[Key]>;
};

type DataOrFilters<ObjectType extends AnyObject = AnyObject> = { $or: DataFilters<ObjectType>[]; };

export type DataFilters<ObjectType extends AnyObject = AnyObject> = DataObjectTypeFilters<ObjectType> | DataOrFilters<ObjectType>;
