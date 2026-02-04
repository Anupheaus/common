/* eslint-disable max-classes-per-file */
import './object';
import type { MapDelegate, SimpleMapDelegate, ArrayOrderByConfig, IArrayDiff, IMergeWithOptions, GroupingDelegate, DataSorts, DataSort } from '../models';
import { MergeWithUpdateOperations } from '../models';
import { ArgumentInvalidError } from '../errors/ArgumentInvalidError';
import { SortDirections } from '../models/sort';
import type { DeepPartial, Record, TypeOf, Upsertable, UpdatableRecord, NonNullableOrVoid, AnyObject } from './global';
import './reflect';
import { is } from './is';
import { InternalError } from '../errors';

type FilterDelegate<T> = (item: T, index: number) => boolean;
type UpdateDelegate<T> = MapDelegate<T, DeepPartial<T>>;
type CalculationDelegate<T> = (item: T, index: number, prevItem: T, nextItem: T) => number;
type DiffMatcherDelegate<T, P> = (sourceItem: T, targetItem: P, sourceIndex: number, targetIndex: number) => boolean;
type RemoveNull<T> = Exclude<T, null | undefined>;

type FlattenedArray<Arr> = Arr extends unknown[] ? (Arr extends unknown[][] ? FlattenedArray<Arr[number]> : Arr) : Arr[];

interface MergeOptions<T, R, V> {
  matchBy(firstItem: T, secondItem: R): boolean;
  mapMatchedTo?(firstItem: T, secondItem: R, firstItemIndex: number, secondItemIndex: number): V;
  mapUnmatchedLeftTo?(firstItem: T, firstItemIndex: number): V | undefined;
  mapUnmatchedRightTo?(secondItem: R): V | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isRecord(item: any): item is Record {
  return item != null && typeof (item) === 'object' && 'id' in item;
}

function performUpsert<T>(target: T[], foundIndex: number, found: UpdateDelegate<T>, notFound?: (() => T), index?: number, merge = true): T[] {
  const array = target.slice();
  let item: T = undefined as unknown as T;
  if (foundIndex !== -1) {
    const originalItem = target[foundIndex];
    const partialItem = found(target[foundIndex], foundIndex);
    const isPrimitive = ['string', 'number', 'boolean'].includes(typeof (originalItem));
    const isIndexChanged = !(index == null || foundIndex === index);
    if (isPrimitive) {
      item = partialItem as T;
      if (originalItem === item && !isIndexChanged) { return target; }
    } else {
      item = merge ? Object.merge({}, originalItem, partialItem) : partialItem as T;
      if (is.shallowEqual(item, originalItem) && !isIndexChanged) { return target; } // no change
    }
    array.splice(foundIndex, 1);
  } else {
    if (typeof (notFound) !== 'function') { return target; }
    item = notFound();
  }
  if (typeof (index) !== 'number') { index = foundIndex === -1 ? target.length : foundIndex; }
  array.splice(index, 0, item);
  return array;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const emptyArray: any[] = [];

export class ArrayExtensions<T> {

  /**
   * Takes the values returned, which are expected to be an array and returns a flat array of all the returned values, in the order that they are provided in.
   * @param map A delegate that takes each value from the original array and returns an array of values, which will then be flattened when returned.
   * @returns A flattened array of the values provided for each element of the original array.
   */
  public mapMany<V>(map: MapDelegate<T, V[]>): V[];
  public mapMany<V>(this: T[], map: MapDelegate<T, V[]>): V[] {
    const data = this.map(map);
    let result: V[] = [];
    data.chunk(65534).forEach(block => { result = Array.prototype.concat.apply(result, block) as unknown as V[]; });
    return result;
  }

  public flatten(): FlattenedArray<T>;
  public flatten(this: T[]): FlattenedArray<T> {
    const result: T[] = [];
    const parseArrayItem = (items: T | T[]) => {
      if (items instanceof Array) {
        items.forEach(parseArrayItem);
      } else {
        result.push(items);
      }
    };
    parseArrayItem(this);
    return result as FlattenedArray<T>;
  }

  public groupBy<K>(groupingDelegate: GroupingDelegate<T, K>): Map<K, T[]>;
  public groupBy<K>(this: T[], groupingDelegate: GroupingDelegate<T, K>): Map<K, T[]> {
    const groups = new Map<K, T[]>();
    this.forEach((item, index) => (key => groups.set(key, (groups.get(key) ?? []).concat(item)))(groupingDelegate(item, index, Array.from(groups.keys()))));
    return groups;
  }

  public ofType<V>(type: TypeOf<V>): V[];
  public ofType(type: 'string'): string[];
  public ofType(type: 'number'): number[];
  public ofType<V>(this: T[], type: TypeOf<V> | 'string' | 'number'): V[] {
    if (typeof (type) === 'string') {
      return this.filter(item => typeof (item) === type).cast<V>();
    } else {
      return this.filter(item => item instanceof type).cast<V>();
    }
  }

  public cast<V>(): V[];
  public cast<V>(this: T[]): V[] {
    return this as unknown as V[];
  }

  public single(): T | undefined;
  public single(filter: FilterDelegate<T>): T | undefined;
  public single(this: T[], filter?: FilterDelegate<T>): T | undefined {
    const result = filter ? this.filter(filter) : this;
    if (result.length > 1) { throw new Error('Multiple items were found when only one was expected.'); }
    if (result.length === 1) { return result[0]; }
    return undefined; // needs to be undefined so that when spread, a default can be set instead if required
  }

  public first(): T | undefined;
  public first(filter: FilterDelegate<T>): T | undefined;
  public first(this: T[], filter?: FilterDelegate<T>): T | undefined {
    if (this.length === 0) { return; }
    if (typeof (filter) !== 'function') { return this[0]; }
    return this.find(filter);
  }

  public last(): T | undefined;
  public last(filter: FilterDelegate<T>): T | undefined;
  public last(this: T[], filter?: FilterDelegate<T>): T | undefined {
    if (this.length === 0) { return undefined as unknown as T; }
    if (typeof (filter) !== 'function') { return this[this.length - 1]; }
    return this.slice().reverse().find(filter);
  }

  public clone(): T[];
  public clone(this: T[]): T[] {
    return this.slice();
  }

  public filterByIds<R extends T & Record>(values: R[]): T[];
  public filterByIds(ids: string[]): T[];
  public filterByIds<R extends T & Record>(this: R[], valuesOrIds: R[] | string[]): T[] {
    const ids = valuesOrIds.map(v => typeof (v) === 'string' ? v : v.id).distinct();
    return this.filter(item => ids.includes(item.id));
  }

  public filterBy<K extends keyof T>(field: K, value: T[K]): T[];
  public filterBy<K extends keyof T>(this: T[], field: K, value: T[K]): T[] {
    return this.filter(item => item[field] === value);
  }

  public remove(item: T): T[];
  public remove(this: T[], item: T): T[] {
    let index = this.indexOf(item);
    if (index === -1) { return this; }
    const clone = this.slice();
    do {
      clone.splice(index, 1);
      index = clone.indexOf(item);
    } while (index >= 0);
    return clone;
  }

  public removeMany(items: T[]): T[];
  public removeMany(this: T[], items: T[]): T[] {
    return this.filter(item => items.indexOf(item) === -1);
  }

  public removeAt(index: number): T[];
  public removeAt(this: T[], index: number): T[] {
    const clone = this.slice();
    clone.splice(index, 1);
    return clone;
  }

  public removeByFilter(filter: FilterDelegate<T>): T[];
  public removeByFilter(this: T[], filter: FilterDelegate<T>): T[] {
    if (typeof (filter) !== 'function') { throw new ArgumentInvalidError('filter'); }
    let hasRemovedItem = false;
    const clone = this.slice();
    for (let index = clone.length - 1; index >= 0; index--) { if (filter(clone[index], index)) { clone.splice(index, 1); hasRemovedItem = true; } }
    return hasRemovedItem ? clone : this;
  }

  public removeById(id: string): T[];
  public removeById(this: T[], id: string): T[] {
    return this.removeByFilter(item => isRecord(item) && item.id === id);
  }

  public indexOfId(id: string): number;
  public indexOfId(this: T[], id: string): number {
    return this.findIndex(item => isRecord(item) && item.id === id);
  }

  public findById(id: string): T | undefined;
  public findById(this: T[], id: string): T | undefined {
    return this.find(item => isRecord(item) && item.id === id);
  }

  public upsert(item: Upsertable<T>): T[];
  public upsert(item: Upsertable<T>, index: number): T[];
  public upsert(this: T[], item: Upsertable<T>, index?: number): T[] {
    const foundIndex = isRecord(item) ? this.indexOfId(item.id) : this.indexOf(item as T);
    return performUpsert(this, foundIndex, () => item as DeepPartial<T>, () => item as T, index, false);
  }

  public upsertMany(this: T[], items: Upsertable<T>[], newIndex?: number): T[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self = this;
    items.forEach((item, index) => self = newIndex == null ? self.upsert(item) : self.upsert(item, newIndex + index));
    return self;
  }

  public upsertWhere(filter: FilterDelegate<T>, update: UpdateDelegate<T | undefined>): T[];
  public upsertWhere(this: T[], filter: FilterDelegate<T>, update: UpdateDelegate<T | undefined>): T[] {
    let hasUpserted = false;
    const array = this.map((innerItem, index) => {
      if (!filter(innerItem, index)) { return innerItem; }
      hasUpserted = true;
      return Object.merge({}, innerItem, update(innerItem, index));
    });
    return hasUpserted ? array : array.concat(update(undefined, array.length) as T);
  }

  public repsert(item: T): T[];
  public repsert(item: T, delegate: FilterDelegate<T>): T[];
  public repsert(this: T[], item: T, delegate?: FilterDelegate<T>): T[] {
    const foundIndex = delegate != null ? this.findIndex(delegate) : isRecord(item) ? this.indexOfId(item.id) : this.indexOf(item as T);
    return performUpsert(this, foundIndex, () => item as DeepPartial<T>, () => item as T, undefined, false);
  }

  public replace(item: T): T[];
  public replace(item: T, index: number): T[];
  public replace(this: T[], item: T, index?: number): T[] {
    const foundIndex = isRecord(item) ? this.indexOfId(item.id) : typeof (index) === 'number' ? Math.max(index, -1) : -1;
    if (foundIndex === -1) { return this; }
    return performUpsert(this, foundIndex, () => item as DeepPartial<T>, undefined, index, false);
  }

  public replaceMany(items: T[]): T[];
  public replaceMany(items: T[], index: number): T[];
  public replaceMany(this: T[], items: T[], index?: number): T[] {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    let self = this;
    items.forEach((item, innerIndex) => self = index == null ? self.replace(item) : self.replace(item, index + innerIndex));
    return self;
  }

  public update(item: UpdatableRecord<T & Record>): T[];
  public update(filter: FilterDelegate<T>, update: UpdateDelegate<T>): T[];
  public update(this: T[], filterOrItem: FilterDelegate<T> | UpdatableRecord<T & Record>, update?: UpdateDelegate<T>): T[] {
    if (typeof (filterOrItem) === 'function') {
      const filter = filterOrItem as FilterDelegate<T>;
      let hasUpdated = false;
      let array = undefined as unknown as T[];
      for (let index = 0; index < this.length; index++) {
        if (filter(this[index], index)) {
          hasUpdated = true;
          array = array ?? this.slice();
          array = performUpsert(array, index, (update ?? (item => item)) as UpdateDelegate<T>, undefined, index);
        }
      }
      if (!hasUpdated) { return this; }
      return array;
    } else if (isRecord(filterOrItem)) {
      const foundIndex = this.indexOfId(filterOrItem.id);
      if (foundIndex === -1) { return this; }
      return this.insert(filterOrItem as T);
    }
    return this;
  }

  public insert(item: T): T[];
  public insert(item: T, index: number): T[];
  public insert(items: T[], index: number): T[];
  public insert(this: T[], itemOrItems: T | T[], index?: number): T[] {
    const items = itemOrItems instanceof Array ? itemOrItems : [itemOrItems];
    const result = this.slice();
    index = index == null ? this.length - 1 : index;
    result.splice(index, 0, ...items);
    return result;
  }

  public chunk(size: number): T[][];
  public chunk(this: T[], size: number): T[][] {
    const totalBlocks = Math.ceil(this.length / size);
    const results = new Array<T[]>();
    for (let blockIndex = 0; blockIndex < totalBlocks; blockIndex++) { results.push(this.slice(blockIndex * size, (blockIndex + 1) * size)); }
    return results;
  }

  public clear(): void;
  public clear(this: T[]): void {
    this.length = 0;
  }

  public move(from: number, to: number): T[];
  public move(this: T[], from: number, to: number): T[] {
    const clone = this.slice();
    const items = clone.splice(from, 1);
    clone.splice(to, 0, items[0]);
    return clone;
  }

  public orderBy(sorts: DataSorts<T extends AnyObject ? T : never>): T[];
  public orderBy<R>(sorterDelegate: SimpleMapDelegate<T, R>): T[];
  public orderBy<R>(sorterDelegate: SimpleMapDelegate<T, R>, direction: SortDirections): T[];
  public orderBy(config: ArrayOrderByConfig<T>[]): T[];
  public orderBy<R>(this: T[], arg: SimpleMapDelegate<T, R> | (ArrayOrderByConfig<T>[]) | DataSorts<any>, sortDirection: SortDirections = SortDirections.Ascending): T[] {
    let items: ArrayOrderByConfig<T>[] | DataSort[] = [];
    if (typeof (arg) === 'function') { items = [{ delegate: arg, direction: sortDirection }]; }
    else if (typeof (arg) === 'string') { items = [[arg, 'asc']]; }
    else if (arg instanceof Array) { items = arg as DataSort[]; }
    if (items instanceof Array) {
      if (items.length === 0) return this;
      const strictItems: ArrayOrderByConfig<any>[] = items.mapWithoutNull(item => {
        let delegate: SimpleMapDelegate<T, any> | undefined;
        let direction: SortDirections | undefined;
        if (typeof (item) === 'string') {
          delegate = val => is.object(val) ? val[item] : val;
          direction = sortDirection;
        } else if (item instanceof Array) {
          delegate = val => is.object(val) ? val[item[0]] : val;
          direction = item[1] === 'desc' ? SortDirections.Descending : SortDirections.Ascending;
        } else if (is.object(item) && Reflect.has(item, 'delegate')) {
          delegate = item.delegate;
          direction = item.direction;
        }
        if (delegate != null && direction != null) return { delegate, direction };
      });
      return this
        .slice()
        .sort((a, b) => {
          for (const { delegate, direction } of strictItems) {
            const aVal: any = delegate(a); // eslint-disable-line @typescript-eslint/no-explicit-any
            const bVal: any = delegate(b); // eslint-disable-line @typescript-eslint/no-explicit-any
            const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            if (result !== 0) { return (direction === SortDirections.Descending ? -1 : 1) * result; }
          }
          return 0;
        });
    }
    return this;
  }

  public removeNull(): RemoveNull<T>[];
  public removeNull(this: T[]): RemoveNull<T>[] {
    return this.filter(item => item != null) as RemoveNull<T>[];
  }

  public except(array: T[]): T[];
  public except<U extends Record>(array: U[]): T[];
  public except<U extends Record>(this: T[], array: T[] | U[]): T[] {
    const results = this
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter(item => item && isRecord(item) && item.id != null ? array.findById(item.id) == null : !array.includes(item as any));
    return results.length === this.length ? this : results;
  }

  public exceptWhere(filter: FilterDelegate<T>): T[];
  public exceptWhere(this: T[], filter: FilterDelegate<T>): T[] {
    return this.filter((item, index) => !filter(item, index));
  }

  public distinct(): T[];
  public distinct<V>(delegate: MapDelegate<T, V>): T[];
  public distinct(key: keyof T): T[];
  public distinct<V>(this: T[], keyOrDelegate: keyof T | ((item: T, index: number) => V) = item => item as unknown as V): T[] {
    const values = new Array<V>();
    const results = new Array<T>();
    const delegate = typeof (keyOrDelegate) === 'function' ? keyOrDelegate : (item: T) => item[keyOrDelegate] as unknown as V;
    this.forEach((item, index) => {
      const value = delegate(item, index);
      if (values.includes(value)) { return; }
      values.push(value);
      results.push(item);
    });
    return results.length === this.length ? this : results;
  }

  public equals(array: T[]): boolean;
  public equals(array: T[], ignoreOrder: boolean): boolean;
  public equals(this: T[], array: T[], ignoreOrder = true): boolean {
    if (this === array || (this.length === 0 && array.length === 0)) { return true; }
    if (this.length !== array.length) { return false; }
    const a1 = ignoreOrder ? this.slice().sort() : this;
    const a2 = ignoreOrder ? array.slice().sort() : array;
    for (let index = 0; index < a1.length; index++) {
      if (a1[index] !== a2[index]) { return false; }
    }
    return true;
  }

  public sum(): number;
  public sum(delegate: CalculationDelegate<T>): number;
  public sum(this: T[], delegate?: CalculationDelegate<T>): number {
    const newDelegate = typeof (delegate) === 'function' ? delegate : (item: T) => item as unknown as number;
    return this.reduce((a, b, i) => a + newDelegate(b, i, this[i - 1], this[i + 1]), 0);
  }

  public min(): number;
  public min(delegate: CalculationDelegate<T>): number;
  public min(this: T[], delegate?: CalculationDelegate<T>): number {
    const newDelegate = typeof (delegate) === 'function' ? delegate : (item: T) => item as unknown as number;
    return this
      .map((t, i, a) => newDelegate(t, i, a[i - 1], a[i + 1]))
      .sort((a, b) => a != null && b != null ? a - b : a == null ? 1 : b == null ? -1 : 0)
      .first() ?? 0;
  }

  public max(): number;
  public max(delegate: CalculationDelegate<T>): number;
  public max(this: T[], delegate?: CalculationDelegate<T>): number {
    const newDelegate = typeof (delegate) === 'function' ? delegate : (item: T) => item as unknown as number;
    return this
      .map((t, i, a) => newDelegate(t, i, a[i - 1], a[i + 1]))
      .sort((a, b) => a != null && b != null ? a - b : a == null ? -1 : b == null ? 1 : 0)
      .last() ?? 0;
  }

  public mapWithoutNull<V>(delegate: MapDelegate<T, V>): NonNullableOrVoid<V>[];
  public mapWithoutNull<V>(this: T[], delegate: MapDelegate<T, V>): NonNullableOrVoid<V>[] {
    const results: NonNullableOrVoid<V>[] = [];
    this.forEach((item, index) => {
      const value = delegate(item, index);
      if (value != null) { results.push(value as any); }
    });
    return results;
  }

  public average(): number;
  public average(delegate: CalculationDelegate<T>): number;
  public average(this: T[], delegate?: CalculationDelegate<T>): number {
    if (typeof (delegate) !== 'function') { delegate = item => item as unknown as number; }
    const values: number[] = [];
    for (let index = 0; index < this.length; index++) {
      const item = this[index];
      const value = delegate(item, index, this[index - 1], this[index + 1]);
      if (typeof (value) === 'number') { values.push(value); }
    }
    return values.length > 0 ? values.sum() / values.length : 0;
  }

  public aggregate(method: 'sum' | 'max' | 'min' | 'average'): number;
  public aggregate(method: 'sum' | 'max' | 'min' | 'average', delegate: CalculationDelegate<T>): number;
  public aggregate(method: 'sum' | 'max' | 'min' | 'average', delegate?: CalculationDelegate<T>): number {
    const providedDelegate = delegate as CalculationDelegate<T>;
    switch (method) {
      case 'max': return this.max(providedDelegate);
      case 'min': return this.min(providedDelegate);
      case 'average': return this.average(providedDelegate);
      default: return this.sum(providedDelegate);
    }
  }

  public absorb(array: T[]): T[];
  public absorb(this: T[], array: T[]): T[] {
    if (array.length < 65535) {
      Array.prototype.push.apply(this, array);
    } else {
      array.chunk(65534).forEach(part => Array.prototype.push.apply(this, part));
    }
    return this;
  }

  public any(): T;
  public any(this: T[]): T {
    const random = Math.floor(Math.random() * this.length);
    return this[random];
  }

  public takeUntil(this: T[], delegate: FilterDelegate<T>): T[];
  public takeUntil(this: T[], delegate: FilterDelegate<T>, andIncluding: boolean): T[];
  public takeUntil(this: T[], delegate: FilterDelegate<T>, andIncluding = false): T[] {
    const results: T[] = [];
    for (let index = 0; index < this.length; index++) {
      const item = this[index];
      if (delegate(item, index)) {
        if (andIncluding) { results.push(item); }
        break;
      }
      results.push(item);
    }
    return results;
  }

  public diff<P extends Record>(items: P[]): IArrayDiff<T, P>;
  public diff<P>(items: P[], matcher: DiffMatcherDelegate<T, P>): IArrayDiff<T, P>;
  public diff<P>(this: T[], items: P[], matcher?: DiffMatcherDelegate<T, P>): IArrayDiff<T, P> {
    matcher = typeof (matcher) === 'function' ? matcher : (source, target) => isRecord(source) && isRecord(target) ? source.id === target.id : source === target as unknown;
    const targetItems = items.map((item, index) => ({ item, index }));
    const result: IArrayDiff<T, P> = {
      added: [],
      removed: [],
      matched: [],
    };
    this.forEach((sourceItem, sourceIndex) => {
      let matchFound = false;
      targetItems.some((target, targetActualIndex) => {
        const { item: targetItem, index: targetIndex } = target;
        if (matcher?.(sourceItem, targetItem, sourceIndex, targetIndex)) {
          matchFound = true;
          result.matched.push({ sourceItem, targetItem });
          targetItems.splice(targetActualIndex, 1);
          return true;
        }
      });
      if (!matchFound) { result.removed.push(sourceItem); }
    });
    result.added.push(...targetItems.map(target => target.item));
    return result;
  }

  public ids(): string[];
  public ids(this: T[]): string[] {
    const results: string[] = [];
    for (const item of this) { if (isRecord(item) && typeof (item.id) === 'string' && item.id.length > 0) { results.push(item.id); } }
    return results;
  }

  /** @deprecated Please use merge */
  public mergeWith<P>(items: P[]): T[];
  public mergeWith<P>(items: P[], options: IMergeWithOptions<T, P>): T[];
  public mergeWith<P>(this: T[], items: P[], options?: IMergeWithOptions<T, P>): T[] {
    const newOptions: Required<IMergeWithOptions<T, P>> = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      matchBy: (a: any, b: any) => a === b || (isRecord(a) && isRecord(b) && a.id != null && a.id === b.id),
      updateMatched: MergeWithUpdateOperations.KeepSource,
      updateUnmatched: a => a,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createBy: (b: any) => b,
      removeUnmatched: false,
      addNew: true,
      matchOrder: false,
      ...options,
    };
    let result: unknown[] = [];
    let changeFound = false;

    if (newOptions.matchOrder) {
      result = items.mergeWith(this, {
        matchBy: (b, a) => newOptions.matchBy(a, b),
        updateMatched: (b, a, bi, ai): P => {
          const u = newOptions.updateMatched(a, b, ai, bi);
          if (ai !== bi || u !== a) { changeFound = true; }
          return u as unknown as P;
        },
        updateUnmatched: b => { changeFound = true; return newOptions.createBy(b) as unknown as P; },
        createBy: b => { changeFound = true; return b as unknown as P; },
        removeUnmatched: item => typeof (newOptions.addNew) === 'function' ? !newOptions.addNew(item) : !newOptions.addNew,
        addNew: item => typeof (newOptions.removeUnmatched) === 'function' ? !newOptions.removeUnmatched(item) : !newOptions.removeUnmatched,
        matchOrder: false,
      });
      if (result === items) { return result.slice() as T[]; }
      if (!changeFound) { return this; }
      return result as T[];
    }

    const matchedItems: P[] = [];

    this.forEach((a, ai) => {
      let matchFound = false;
      items.forEach((b, bi) => {
        if (newOptions.matchBy(a, b)) {
          const u = newOptions.updateMatched(a, b, ai, bi);
          if (u !== a) { changeFound = true; }
          result.push(u);
          matchedItems.push(b);
          matchFound = true;
        }
      });
      if (!matchFound) {
        if (typeof (newOptions.removeUnmatched) === 'function' ? newOptions.removeUnmatched(a) : newOptions.removeUnmatched) {
          changeFound = true;
        } else {
          const u = newOptions.updateUnmatched(a);
          if (u !== a) { changeFound = true; }
          result.push(u);
        }
      }
    });

    if (typeof (newOptions.addNew) === 'function' || newOptions.addNew) {
      const addNewFilter = typeof (newOptions.addNew) === 'function' ? newOptions.addNew : () => true;
      const newItems = items.except(matchedItems).filter(addNewFilter).map(newOptions.createBy);

      if (newItems.length > 0) {
        result.absorb(newItems);
        changeFound = true;
      }
    }

    if (!changeFound) { return this; }
    return result as T[];
  }

  public merge<R, V = [T | undefined, R | undefined][]>(secondArray: R[], options: MergeOptions<T, R, V>): V[];
  public merge<R, V = [T | undefined, R | undefined][]>(this: T[], secondArray: R[], options: MergeOptions<T, R, V>): V[] {
    const { matchBy, mapMatchedTo, mapUnmatchedLeftTo, mapUnmatchedRightTo } = options;
    const results: V[] = [];
    const cloneOfSecondArray = new Set(secondArray);

    this.forEach((firstItem, firstItemIndex) => {
      let hasFirstMatched = false;
      secondArray.forEach((secondItem, secondItemIndex) => {
        if (!matchBy(firstItem, secondItem)) return;
        cloneOfSecondArray.delete(secondItem);
        hasFirstMatched = true;
        results.push((mapMatchedTo == null ? [firstItem, secondItem] : mapMatchedTo(firstItem, secondItem, firstItemIndex, secondItemIndex)) as V);
      });
      if (!hasFirstMatched) results.push((mapUnmatchedLeftTo == null ? [firstItem, undefined] : mapUnmatchedLeftTo(firstItem, firstItemIndex)) as V);
    });
    cloneOfSecondArray.forEach(secondItem => results.push((mapUnmatchedRightTo == null ? [undefined, secondItem] : mapUnmatchedRightTo(secondItem)) as V));
    return results;
  }

  public syncWith<P>(items: P[]): T[];
  public syncWith<P>(items: P[], options: IMergeWithOptions<T, P>): T[];
  public syncWith<P>(this: T[], items: P[], options?: IMergeWithOptions<T, P>): T[] {
    return this.mergeWith(items, {
      ...options,
      removeUnmatched: true,
      matchOrder: true,
    });
  }

  public findMap<R>(predicate: (item: T, index: number) => R | undefined): R | undefined;
  public findMap<R>(this: T[], predicate: (item: T, index: number) => R | undefined): R | undefined {
    for (let i = 0; i < this.length; i++) {
      const result = predicate(this[i], i);
      if (result !== undefined) { return result; }
    }
  }

  /** @deprecated Please use forEachAsync */
  public async forEachPromise(callback: (item: T, index: number) => Promise<void>): Promise<void>;
  public async forEachPromise(this: T[], callback: (item: T, index: number) => Promise<void>): Promise<void> {
    return this.forEachAsync(callback);
  }

  public async forEachAsync(callback: (item: T, index: number) => Promise<void>): Promise<void>;
  public async forEachAsync(this: T[], callback: (item: T, index: number) => Promise<void>): Promise<void> {
    const [, errors] = await Promise.whenAllSettled(this.map((item, index) => callback(item, index)));
    if (errors.length === 0) return;
    const errorMessages = errors.map(error => error.message).distinct().join('\n');
    throw new InternalError(`The following errors occurred while looping through the array:\n${errorMessages}`, { meta: { errors } });
  }

  /** @deprecated Please use mapAsync */
  public async mapPromise<R>(callback: (item: T, index: number) => Promise<R>): Promise<R[]>;
  public async mapPromise<R>(this: T[], callback: (item: T, index: number) => Promise<R>): Promise<R[]> {
    return this.mapAsync(callback);
  }

  public async mapAsync<R>(callback: (item: T, index: number) => Promise<R>): Promise<R[]>;
  public async mapAsync<R>(this: T[], callback: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const [results, errors] = await Promise.whenAllSettled(this.map((item, index) => callback(item, index)));
    if (errors.length === 0) return results;
    const errorMessages = errors.map(error => error.message).distinct().join('\n');
    throw new InternalError(`The following errors occurred while mapping through the array:\n${errorMessages}`, { meta: { errors } });
  }

  public findBy<K extends keyof T>(field: K, value: T[K]): T | undefined;
  public findBy<K extends keyof T>(this: T[], field: K, value: T[K]): T | undefined {
    return this.find(item => item[field] === value);
  }

  public toggle(item: T): T[];
  public toggle(item: T, include: boolean): T[];
  public toggle(this: T[], item: T, include?: boolean): T[] {
    if (this.includes(item) && (include == null || include === false)) return this.remove(item);
    return include == null || include === true ? this.upsert(item) : this;
  }

  public generateNextName<P extends T & ({ name: string; } | { text: string; })>(this: P[], name: string): string;
  public generateNextName(matcher: (item: T, index: number) => number, generator: (index: number) => string): string;
  public generateNextName(this: T[], matcherOrName: string | ((item: T, index: number) => number), generator?: (index: number) => string): string {
    const matcher = (is.function(matcherOrName) ? matcherOrName : item => {
      if (typeof (item) !== 'object' || item == null) return 0;
      try {
        const value = 'name' in item ? item.name : ('text' in item ? item.text : '');
        if (typeof (value) !== 'string') return 0;
        const numberValue = value.match(new RegExp(`${matcherOrName} (\\d+)`))?.[1];
        if (numberValue == null) return 0;
        const number = parseInt(numberValue, 10);
        if (isNaN(number)) return 0;
        return number;
      } catch (error) {
        return 0;
      }
    }) as (item: T, index: number) => number;
    if (generator == null) generator = index => `${matcherOrName} ${index}`;
    const max = this.reduce((a, b, index) => Math.max(a, matcher(b, index)), 0);
    return generator(max + 1);
  }

  public random(): T | undefined;
  public random(this: T[]): T | undefined {
    if (this.length === 0) return;
    const randomIndex = Math.floor(Math.random() * this.length);
    return this[randomIndex];
  }

  public randomMany(count: number): T[];
  public randomMany(this: T[], count: number): T[] {
    if (this.length === 0 || count === 0) return [];
    if (count >= this.length) return this;
    const results: T[] = [];
    do {
      const randomItem = this.random();
      if (randomItem && !results.includes(randomItem)) { results.push(randomItem); }
    } while (results.length < count);
    return results;
  }

  public take(count: number): T[];
  public take(this: T[], count: number): T[] {
    if (this.length === 0 || this.length <= count) { return this; }
    if (count === 0) { return []; }
    return this.slice(0, count);
  }

  public takeLast(count: number): T[];
  public takeLast(this: T[], count: number): T[] {
    if (this.length === 0 || this.length <= count) { return this; }
    if (count === 0) { return []; }
    return this.slice(this.length - count);
  }

  /**
   * Returns the remaining items of this array after the required number of items (count) have been skipped.
   * @param {number} count The number of items to skip within this array.
   * @returns {T[]} If the length of this array is zero or the number of items to skip is 0, this array will be returned without modification.  If the length of this array is
   * less than the number of items to skip then a blank array is returned.  Otherwise the remainder of the array, after the required number of items have been skipped,
   * will be returned.
   */
  public skip(count: number): T[];
  public skip(this: T[], count: number): T[] {
    if (this.length === 0 || count === 0) { return this; }
    if (this.length < count) { return []; }
    return this.slice(count);
  }

  public toMap(): Map<string, T>;
  public toMap<K>(createKey: (item: T, index: number, array: T[]) => K): Map<K, T>;
  public toMap<K = string>(this: T[], createKey?: (item: T, index: number, array: T[]) => K): Map<K, T> {
    const throwError = (index: number): K => {
      throw new Error(`Item at index ${index} of this array is not a record and no createKey delegate was provided to generate the key.`);
    };
    return new Map(this.map((item, index, arr) => [createKey ? createKey(item, index, arr) : isRecord(item) ? item.id as unknown as K : throwError(index), item]));
  }

  public toSet(): Set<T>;
  public toSet(this: T[]): Set<T> {
    return new Set(this);
  }

  public hasAnyOf(items: T[]): boolean;
  public hasAnyOf(this: T[], items: T[]): boolean {
    let ids: string[] | undefined = undefined;
    if (this.length === 0 || items.length === 0) return false;
    return items.some(item => {
      if (is.record(item)) {
        if (ids == null) ids = this.ids();
        return ids.includes(item.id);
      } else {
        return this.includes(item);
      }
    });
  }

}

export class ArrayConstructorExtensions {

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public ofSize<T = any>(length: number): T[] {
    return new Array(length).fill(undefined, 0, length);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public empty<T = any>(): Array<T> {
    return emptyArray;
  }

}
