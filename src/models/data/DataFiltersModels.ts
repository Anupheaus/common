import { DateTime } from 'luxon';
import type { AnyObject, PrimitiveType } from '../../extensions';
import { is } from '../../extensions/is';
import type { ListItem } from '../../extensions/ListItem';
import { ListItems } from '../../extensions/ListItem';

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
  { id: '$exists', text: 'exists', acceptableTypes: ['string', 'number', 'boolean', 'date', 'currency'] }
] as const);

export const DataFilterOperators = DataFilterOperatorPairs;
export type DataFilterOperator = typeof filterOperatorIds;

export namespace DataFilterOperator {
  export const booleanKeys = ['$exists'] as const;
  export const singleValueKeys = ['$gt', '$lt', '$gte', '$lte', '$eq', '$ne', '$like', '$beginsWith', '$endsWith'] as const;
  export const multiValueKeys = ['$in', '$ni'] as const;
  export const arrayValueSingleKeys = ['$elemMatch'] as const;
  export const arrayValueMultiKeys = ['$in', '$ni'] as const;
  export const allKeys = [...singleValueKeys, ...multiValueKeys, ...booleanKeys] as const;
}

type SingleValueKeys<ValueType> = Partial<Record<typeof DataFilterOperator.singleValueKeys[number], ValueType | null>>;
type MultiValueKeys<ValueType> = Partial<Record<typeof DataFilterOperator.multiValueKeys[number], ValueType[]>>;
type BooleanValueKeys = Partial<Record<typeof DataFilterOperator.booleanKeys[number], boolean>>;
// eslint-disable-next-line max-len
type ArrayValueKeys<ValueType extends Array<any>> = Partial<Record<typeof DataFilterOperator.arrayValueSingleKeys[number], ValueType[number]> & Record<typeof DataFilterOperator.arrayValueMultiKeys[number], ValueType>>;

/* eslint-disable @typescript-eslint/indent */
type WhereClauseWrapper<ValueType> =
  NonNullable<ValueType> extends Array<any> ? ArrayValueKeys<NonNullable<ValueType>> & BooleanValueKeys
  : NonNullable<ValueType> extends PrimitiveType ? SingleValueKeys<ValueType> & MultiValueKeys<ValueType> & BooleanValueKeys
  : NonNullable<ValueType> extends DateTime<any> ? SingleValueKeys<ValueType> & BooleanValueKeys
  : NonNullable<ValueType> extends AnyObject ? DataFilters<NonNullable<ValueType>> & BooleanValueKeys : never;
/* eslint-enable @typescript-eslint/indent */

type NonArrayOf<ValueType> = ValueType extends Array<infer T> ? T : ValueType;

type DataObjectTypeFilters<ObjectType extends AnyObject = AnyObject> = {
  [Key in keyof ObjectType]?: ObjectType[Key] | NonArrayOf<ObjectType[Key]> | WhereClauseWrapper<ObjectType[Key]>;
};

type DataOrFilters<ObjectType extends AnyObject = AnyObject> = { $or?: DataFilters<ObjectType>[]; $and?: DataFilters<ObjectType>[]; };

export type DataFilters<ObjectType extends AnyObject = AnyObject> = DataObjectTypeFilters<ObjectType> | DataOrFilters<ObjectType>;

export namespace DataFilters {

  export interface ParseLeafData {
    path: string[];
    value: unknown;
    operator: DataFilterOperator;
  }

  export interface ParseForkData<L, F> {
    operator: 'or';
    items: (L | F)[][];
  }

  interface ParseConfig<L, F> {
    leaf(data: ParseLeafData): L;
    fork(data: ParseForkData<L, F>): F;
  }

  function parseValue<L, F>(path: string[], value: unknown, config: ParseConfig<L, F>, stack: (L | F)[]): void {
    if (value === undefined) return;
    if (value instanceof Array) {
      stack.push(config.leaf({ path, operator: '$in', value }));
      return;
    }
    if (value === null || is.primitive(value) || value instanceof Date || value instanceof DateTime) {
      stack.push(config.leaf({ path, operator: '$eq', value }));
      return;
    }
    Object.entries(value).forEach(([key, subValue]) => {
      if (DataFilterOperator.allKeys.includes(key as DataFilterOperator)) {
        stack.push(config.leaf({ path, operator: key as DataFilterOperator, value: subValue }));
      } else if (key === '$or') {
        const subStack: (L | F)[][] = [];
        subValue.forEach((subValueItem: unknown) => {
          const subStackItems: (L | F)[] = [];
          parseValue(path, subValueItem, config, subStackItems);
          subStack.push(subStackItems);
        });
        stack.push(config.fork({ operator: 'or', items: subStack }));
      } else {
        parseValue([...path, key], subValue, config, stack);
      }
    });
  }

  export function parse<L, F>(filters: DataFilters, config: ParseConfig<L, F>): (L | F)[] {
    const stack: (L | F)[] = [];
    parseValue([], filters, config, stack);
    return stack;
  }

}