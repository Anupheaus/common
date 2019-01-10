import { ArgumentInvalidError, InternalError } from '../errors';
import { SortDirections } from '../models';
import { DeepPartial, IRecord, TypeOf, Upsert } from './global';
import { is } from './is';
import './reflect';

type FilterDelegate<T> = (item: T, index: number) => boolean;
type SimpleMapDelegate<T, V = any> = (item: T) => V;
type MapDelegate<T, V = any> = (item: T, index: number) => V;
type IfElsePrimitive<T, U> = T extends string | number | boolean ? T : U;
type UpdatableItem<T, TKey extends keyof T = keyof T> = IfElsePrimitive<T, Upsert<T & IRecord, TKey>>;
type UpsertableItem<T, TKey extends keyof T = keyof T> = IfElsePrimitive<T, UpdatableItem<T, TKey>>;
type UpdateDelegate<T> = MapDelegate<T, DeepPartial<T>>;
type CalculationDelegate<T> = (item: T, index: number, prevItem: T, nextItem: T) => number;
type DiffMatcherDelegate<T, P> = (sourceItem: T, targetItem: P, sourceIndex: number, targetIndex: number) => boolean;

export interface IArrayOrderByConfig<T> {
  direction?: SortDirections;
  delegate: SimpleMapDelegate<T>;
}

export interface IMatchedArrayDiffItem<T, P> {
  sourceItem: T;
  targetItem: P;
}

export interface IArrayDiff<T, P> {
  added: P[];
  removed: T[];
  matched: IMatchedArrayDiffItem<T, P>[];
}

export const MergeWithUpdateOperations = {
  UseTargetIfDifferent: (item1: any, item2: any) => item1 === item2 ? item1 : item2,
  KeepSource: (item1: any) => item1,
  KeepTarget: (_item1: any, item2: any) => item2,
  Merge: (item1: any, item2: any) => Object.merge(item1, item2),
};

export interface ISyncWithOptions<T, P> {
  matchBy?(item1: T, item2: P): boolean;
  updateMatched?(item1: T, item2: P, item1Index: number, item2Index: number): T;
  updateUnmatched?(item1: T): T;
  createBy?(item2: P): T;
}

export interface IMergeWithOptions<T, P> extends ISyncWithOptions<T, P> {
  removeUnmatched?: boolean;
  addNew?: boolean;
  matchOrder?: boolean;
}

function performUpsert<T>(target: T[], foundIndex: number, found: UpdateDelegate<T>, notFound: () => T, index: number): T[] {
  const array = target.slice();
  let item: T = null;
  if (foundIndex !== -1) {
    const originalItem = target[foundIndex];
    item = found(target[foundIndex], foundIndex) as any;
    const isPrimitive = is.primitive(originalItem);
    const isIndexChanged = !(index == null || foundIndex === index);
    if (isPrimitive) {
      if (originalItem === item && !isIndexChanged) { return target; }
    } else {
      Object.merge(item, Object.merge({}, originalItem, item));
      if (Reflect.areShallowEqual(item, originalItem) && !isIndexChanged) { return target; } // no change
    }
    array.splice(foundIndex, 1);
  } else {
    if (!is.function(notFound)) { return target; }
    item = notFound();
  }
  if (typeof (index) !== 'number') { index = foundIndex === -1 ? target.length : foundIndex; }
  array.splice(index, 0, item);
  return array;
}

export class ArrayExtensions<T> {

  /**
   * Takes the values returned, which are expected to be an array and returns a flat array of all the returned values, in the order that they are provided in.
   * @param map A delegate that takes each value from the original array and returns an array of values, which will then be flattened when returned.
   * @returns A flattened array of the values provided for each element of the original array.
   */
  public mapMany<V>(map: MapDelegate<T, V[]>): V[];
  public mapMany<V>(this: T[], map: MapDelegate<T, V[]>): V[] {
    const data = this.map(map);
    let result = [];
    data.chunk(65534).forEach(block => result = Array.prototype.concat.apply(result, block));
    return result;
  }

  public ofType<V>(type: TypeOf<V>): V[];
  public ofType(type: 'string'): string[];
  public ofType(type: 'number'): number[];
  public ofType<V>(this: T[], type: TypeOf<V> | 'string' | 'number'): V[] {
    if (typeof (type) === 'string') {
      return this.filter(item => typeof (item) === type).cast<V>();
    } else {
      return this.filter(item => item instanceof type as any).cast<V>();
    }
  }

  public cast<V>(): V[];
  public cast<V>(this: T[]): V[] {
    return this as any as V[];
  }

  public singleOrDefault(): T;
  public singleOrDefault(filter: FilterDelegate<T>): T;
  public singleOrDefault(this: T[], filter?: FilterDelegate<T>): T {
    const result = filter ? this.filter(filter) : this;
    if (result.length > 1) { throw new Error('Multiple items were found when only one was expected.'); }
    if (result.length === 1) { return result[0]; }
    return undefined; // needs to be undefined so that when spread, a default can be set instead if required
  }

  public firstOrDefault(): T;
  public firstOrDefault(filter: FilterDelegate<T>): T;
  public firstOrDefault(this: T[], filter?: FilterDelegate<T>): T {
    if (this.length === 0) { return undefined; }
    if (!is.function(filter)) { return this[0]; }
    return this.find(filter);
  }

  public lastOrDefault(): T;
  public lastOrDefault(filter: FilterDelegate<T>): T;
  public lastOrDefault(this: T[], filter?: FilterDelegate<T>): T {
    if (this.length === 0) { return undefined; }
    if (!is.function(filter)) { return this[this.length - 1]; }
    return this.slice().reverse().find(filter);
  }

  public clone(): T[];
  public clone(this: T[]): T[] {
    return this.slice();
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

  public removeByFilter(filter: FilterDelegate<T>): T[];
  public removeByFilter(this: T[], filter: FilterDelegate<T>): T[] {
    if (!is.function(filter)) { throw new ArgumentInvalidError('filter'); }
    let hasRemovedItem = false;
    const clone = this.slice();
    for (let index = clone.length - 1; index >= 0; index--) { if (filter(clone[index], index)) { clone.splice(index, 1); hasRemovedItem = true; } }
    return hasRemovedItem ? clone : this;
  }

  public removeById(id: string): T[];
  public removeById(this: T[], id: string): T[] {
    return this.removeByFilter(item => item && item['id'] === id);
  }

  public indexOfId(id: string): number;
  public indexOfId(this: T[], id: string): number {
    return this.findIndex(item => item && item['id'] === id);
  }

  public findById(id: string): T;
  public findById(this: T[], id: string): T {
    return this.find(item => item && item['id'] === id);
  }

  public upsert(item: UpsertableItem<T>): T[];
  public upsert(item: UpsertableItem<T>, index: number): T[];
  public upsert(item: UpsertableItem<T>, index: number): T[];
  public upsert(this: T[], item: UpsertableItem<T>, index?: number): T[] {
    const isLiteral = typeof (item) === 'string' || typeof (item) === 'number';
    const foundIndex = item && !isLiteral && item['id'] ? this.indexOfId(item['id']) : this.indexOf(item as T);
    return performUpsert(this, foundIndex, () => item as T, () => item as T, index);
  }

  public upsertMany(this: T[], items: T[], newIndex?: number): T[] {
    // tslint:disable-next-line:no-this-assignment
    let self = this;
    items.forEach((item, index) => self = self.upsert(item as any, newIndex == null ? undefined : newIndex + index));
    return self;
  }

  public replace(item: T): T[];
  public replace(item: T, index: number): T[];
  public replace(this: T[], item: T, index?: number): T[] {
    const isLiteral = typeof (item) === 'string' || typeof (item) === 'number';
    const foundIndex = item && !isLiteral && item['id'] ? this.indexOfId(item['id']) : (index || -1);
    if (foundIndex === -1) { return this; }
    return performUpsert(this, foundIndex, () => item, undefined, index);
  }

  public replaceMany(items: T[]): T[];
  public replaceMany(items: T[], index: number): T[];
  public replaceMany(this: T[], items: T[], index?: number): T[] {
    // tslint:disable-next-line:no-this-assignment
    let self = this;
    items.forEach((item, innerIndex) => self = self.replace(item, index == null ? undefined : index + innerIndex));
    return self;
  }

  public update(filter: FilterDelegate<T>, update: UpdateDelegate<T>): T[];
  public update(this: T[], filter: FilterDelegate<T>, update: UpdateDelegate<T>): T[] {
    let hasUpdated = false;
    let array: T[];
    for (let index = 0; index < this.length; index++) {
      if (filter(this[index], index)) {
        hasUpdated = true;
        if (!array) { array = this.slice(); }
        array = performUpsert(array, index, update, undefined, index);
      }
    }
    if (!hasUpdated) { return this; }
    return array;
  }

  public insert(item: T): T[];
  public insert(item: T, index: number): T[];
  public insert(this: T[], item: T, index?: number): T[] {
    const foundIndex = item && item['id'] ? this.indexOfId(item['id']) : this.indexOf(item);
    if (foundIndex !== -1) { throw new InternalError('The item being inserted already exists in this array.'); }
    const result = this.slice();
    index = index == null ? this.length - 1 : index;
    result.splice(index, 0, item);
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

  public orderBy<R>(sorterDelegate: SimpleMapDelegate<T, R>): T[];
  public orderBy<R>(sorterDelegate: SimpleMapDelegate<T, R>, direction: SortDirections): T[];
  public orderBy(config: IArrayOrderByConfig<T>[]): T[];
  public orderBy<R>(this: T[], arg: SimpleMapDelegate<T, R> | (IArrayOrderByConfig<T>[]), sortDirection: SortDirections = SortDirections.Ascending): T[] {
    let delegates = arg as IArrayOrderByConfig<T>[];
    if (is.function(arg)) { delegates = [{ delegate: arg, direction: sortDirection }]; }
    if (is.array(delegates)) {
      return this
        .slice()
        .sort((a, b) => {
          for (const item of delegates) {
            const aVal = item.delegate(a);
            const bVal = item.delegate(b);
            const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            if (result !== 0) { return (item.direction === SortDirections.Descending ? -1 : 1) * result; }
          }
          return 0;
        });
    }
  }

  public removeNull(): T[];
  public removeNull(this: T[]): T[] {
    return this.filter(item => item != null);
  }

  public except(array: UpdatableItem<T>[]): T[];
  public except(this: T[], array: UpdatableItem<T>[]): T[] {
    const results = this
      .slice()
      .filter(item => {
        if (item && item['id']) { return !array.find(i => i['id'] === item['id']); }
        return !array.includes(item as any);
      });
    return results.length === this.length ? this : results;
  }

  public distinct(): T[];
  public distinct<V>(delegate: MapDelegate<T, V>): T[];
  public distinct<V>(this: T[], delegate: (item: T, index: number) => V = item => item as any): T[] {
    const values = new Array<V>();
    const results = new Array<T>();
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
  public equals(this: T[], array: T[], ignoreOrder: boolean = true): boolean {
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
    if (!is.function(delegate)) { delegate = item => item as any; }
    return this.reduce((a, b, i) => a + delegate(b, i, this[i - 1], this[i + 1]), 0);
  }

  public min(): number;
  public min(delegate: CalculationDelegate<T>): number;
  public min(this: T[], delegate?: CalculationDelegate<T>): number {
    if (!is.function(delegate)) { delegate = item => item as any; }
    return this
      .map((t, i, a) => delegate(t, i, a[i - 1], a[i + 1]))
      .sort((a, b) => a != null && b != null ? a - b : a == null ? 1 : b == null ? -1 : 0)
      .firstOrDefault() || 0;
  }

  public max(): number;
  public max(delegate: CalculationDelegate<T>): number;
  public max(this: T[], delegate?: CalculationDelegate<T>): number {
    if (!is.function(delegate)) { delegate = item => item as any; }
    return this
      .map((t, i, a) => delegate(t, i, a[i - 1], a[i + 1]))
      .sort((a, b) => a != null && b != null ? a - b : a == null ? -1 : b == null ? 1 : 0)
      .lastOrDefault() || 0;
  }

  public average(): number;
  public average(delegate: CalculationDelegate<T>): number;
  public average(this: T[], delegate?: CalculationDelegate<T>): number {
    if (!is.function(delegate)) { delegate = item => item as any; }
    const values: number[] = [];
    for (let index = 0; index < this.length; index++) {
      const item = this[index];
      const value = delegate(item, index, this[index - 1], this[index + 1]);
      if (is.number(value)) { values.push(value); }
    }
    return values.length > 0 ? values.sum() / values.length : 0;
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
  public takeUntil(this: T[], delegate: FilterDelegate<T>, andIncluding: boolean = false): T[] {
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

  public diff<P extends IRecord>(items: P[]): IArrayDiff<T, P>;
  public diff<P>(items: P[], matcher: DiffMatcherDelegate<T, P>): IArrayDiff<T, P>;
  public diff<P>(this: T[], items: P[], matcher?: DiffMatcherDelegate<T, P>): IArrayDiff<T, P> {
    matcher = is.function(matcher) ? matcher : (source, target) => source && target && (source['id'] || target['id']) ? source['id'] === target['id'] : source === target as any;
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
        if (matcher(sourceItem, targetItem, sourceIndex, targetIndex)) {
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
    for (const item of this) { if (item && item['id']) { results.push(item['id']); } }
    return results;
  }

  public mergeWith<P>(items: P[]): T[];
  public mergeWith<P>(items: P[], options: IMergeWithOptions<T, P>): T[];
  public mergeWith<P>(this: T[], items: P[], options?: IMergeWithOptions<T, P>): T[] {
    options = {
      matchBy: (a: any, b: any) => a === b || (a != null && b != null && a.id != null && a.id === b.id),
      updateMatched: MergeWithUpdateOperations.UseTargetIfDifferent,
      updateUnmatched: a => a,
      createBy: (b: any) => b,
      removeUnmatched: false,
      addNew: true,
      matchOrder: false,
      ...options,
    };
    let result = [];
    let changeFound = false;

    if (options.matchOrder) {
      result = items.mergeWith(this, {
        matchBy: (b, a) => options.matchBy(a, b) as any,
        updateMatched: (b, a, bi, ai): any => {
          const u = options.updateMatched(a, b, ai, bi);
          if (ai !== bi || u !== a) { changeFound = true; }
          return u;
        },
        updateUnmatched: (b): any => { changeFound = true; return options.createBy(b); },
        createBy: (b): any => { changeFound = true; return b; },
        removeUnmatched: !options.addNew,
        addNew: !options.removeUnmatched,
        matchOrder: false,
      });
      if (result === items) { return result.slice(); }
      if (!changeFound) { return this; }
      return result;
    }

    const matchedItems = [];

    this.forEach((a, ai) => {
      let matchFound = false;
      items.forEach((b, bi) => {
        if (options.matchBy(a, b)) {
          const u = options.updateMatched(a, b, ai, bi);
          if (u !== a) { changeFound = true; }
          result.push(u);
          matchedItems.push(b);
          matchFound = true;
        }
      });
      if (!matchFound) {
        if (options.removeUnmatched) {
          changeFound = true;
        } else {
          const u = options.updateUnmatched(a);
          if (u !== a) { changeFound = true; }
          result.push(u);
        }
      }
    });

    if (options.addNew) {
      const newItems = items.except(matchedItems).map(options.createBy);

      if (newItems.length > 0) {
        result.absorb(newItems);
        changeFound = true;
      }
    }

    if (!changeFound) { return this; }
    return result;
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

  public take(count: number): T[];
  public take(this: T[], count: number): T[] {
    const clone = this.clone();
    clone.length = count;
    return clone;
  }

}

Object.extendPrototype(Array.prototype, ArrayExtensions.prototype);

declare global {

  // tslint:disable-next-line:interface-name
  interface Array<T> extends ArrayExtensions<T> { }

  // tslint:disable-next-line:interface-name
  interface ArrayConstructor {
    ofSize<T= any>(length: number): T[];
    empty<T= any>(): T[];
  }
}

const emptyArray: any[] = [];

Object.addMethods(Array, [

  function ofSize<T= any>(length: number): T[] {
    return new Array(length).fill(undefined, 0, length);
  },

  function empty(): any[] {
    return emptyArray;
  },

]);
