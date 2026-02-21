import { bind } from '../decorators';
import type { Record, UpsertableRecord } from '../extensions';
import { is } from '../extensions';

export type RecordsModifiedReason = 'add' | 'remove' | 'update' | 'clear' | 'reorder';

export interface OnModifiedOptions<T extends Record = Record> {
  acceptableReasons?: RecordsModifiedReason[];
  acceptableIds?: string[];
  filterOn?(record: T, index: number): boolean;
}

export class Records<T extends Record = Record> {
  constructor();
  constructor(records: T[]);
  constructor(records: Map<string, T>);
  constructor(records?: T[] | Map<string, T>) {
    const arrayOfRecords = (is.array(records) ? records : records instanceof Map ? Array.from(records.values()) : undefined) ?? [];
    this.#records = new Map(arrayOfRecords.map(record => [record.id, record]));
    this.#onModifiedCallbacks = new Set();
  }

  #records: Map<string, T>;
  #onModifiedCallbacks: Set<(records: T[], reason: RecordsModifiedReason, allRecords: T[]) => void>;
  #idsSetCache: Set<string> | null = null;

  #invalidateIdsCache(): void {
    this.#idsSetCache = null;
  }

  #getIdsSet(): Set<string> {
    if (this.#idsSetCache == null) this.#idsSetCache = new Set(this.#records.keys());
    return this.#idsSetCache;
  }

  public get length(): number {
    return this.#records.size;
  }

  public get isEmpty(): boolean {
    return this.#records.size === 0;
  }

  @bind
  public ids(): string[] {
    return Array.from(this.#getIdsSet());
  }

  public indexOf(id: string): number;
  public indexOf(record: T): number;
  public indexOf(predicate: (record: T, index: number) => boolean): number;
  @bind
  public indexOf(arg: string | T | ((record: T, index: number) => boolean)): number {
    if (is.string(arg)) return this.ids().indexOf(arg);
    if (is.function(arg)) return this.toArray().findIndex(arg);
    return this.toArray().indexOf(arg);
  }

  public add(records: T[]): void;
  public add(record: T): void;
  @bind
  public add(recordOrRecords: T | T[]): void {
    const records = is.array(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    const newRecords: T[] = [];
    records.forEach(record => {
      if (!is.string(record.id)) throw new Error('Unable to add record. No valid id found on the record.');
      if (!this.#records.has(record.id)) newRecords.push(record);
      this.#records.set(record.id, record);
    });
    if (newRecords.length === 0) return;
    this.#invalidateIdsCache();
    this.#invokeCallbacks(newRecords, 'add');
  }

  @bind
  public onAdded(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['add'] });
  }

  @bind
  public get(id: string): T | undefined {
    return this.#records.get(id);
  }

  @bind
  public toArray(): T[] {
    return Array.from(this.#records.values());
  }

  @bind
  public toMap(): Map<string, T> {
    return new Map(this.#records);
  }

  public remove(ids: string[]): void;
  public remove(id: string): void;
  public remove(records: T[]): void;
  public remove(record: T): void;
  @bind
  public remove(arg: string | string[] | T | T[]): void {
    const ids = is.string(arg) ? [arg] : is.array(arg) ? arg.map(value => is.string(value) ? value : value.id) : [arg.id];
    const idsSet = new Set(ids);
    const recordsToRemove: T[] = [];
    for (const record of this.#records.values()) {
      if (idsSet.has(record.id)) recordsToRemove.push(record);
    }
    if (recordsToRemove.length === 0) return;
    recordsToRemove.forEach(({ id }) => this.#records.delete(id));
    this.#invalidateIdsCache();
    this.#invokeCallbacks(recordsToRemove, 'remove');
  }

  @bind
  public onRemoved(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['remove'] });
  }

  @bind
  public clear(): void {
    if (this.#records.size === 0) return;
    const oldRecords = this.toArray();
    this.#records.clear();
    this.#invalidateIdsCache();
    this.#invokeCallbacks(oldRecords, 'clear');
  }

  @bind
  public onCleared(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['clear'] });
  }

  public update(records: T[]): void;
  public update(record: T): void;
  public update(ids: string[], predicate: (record: T) => T): void;
  public update(id: string, predicate: (record: T) => T): void;
  @bind
  public update(...args: unknown[]): void {
    const idOrRecordOrRecords = args[0] as string | string[] | T | T[] | undefined;
    if (idOrRecordOrRecords == null) throw new Error('Unable to update record. No record or id provided.');
    const ids = is.string(idOrRecordOrRecords) ? [idOrRecordOrRecords] : is.array(idOrRecordOrRecords) ? idOrRecordOrRecords.map(value => is.string(value) ? value : value.id) : [idOrRecordOrRecords.id];
    if (ids.length === 0) throw new Error('Unable to update record(s). No valid id(s) provided or found on the record(s).');
    let predicate = args[1] as (record: T) => T;
    if (!is.function(predicate)) predicate = record => {
      if (is.array(idOrRecordOrRecords)) return (idOrRecordOrRecords.findById(record.id) ?? record) as T;
      if (is.plainObject(idOrRecordOrRecords)) return idOrRecordOrRecords;
      return record;
    };
    const idsSet = new Set(ids);
    this.#update(record => idsSet.has(record.id) ? predicate(record) : record, 'update');
  }

  public onUpdated(id: string, callback: (record: T) => void): () => void;
  public onUpdated(callback: (records: T[]) => void): () => void;
  @bind
  public onUpdated(...args: unknown[]): () => void {
    const id = (args.length > 1 ? args[0] : undefined) as string;
    const callback = (is.function(args[1]) ? args[1] : is.function(args[0]) ? args[0] : undefined) as ((records: T | T[]) => void) | undefined;
    if (args.length > 1 && !is.string(id)) throw new Error('Unable to listen for updates. No valid id provided.');
    if (callback == null) throw new Error('Unable to listen for updates. No valid callback provided.');
    return this.onModified(records => {
      if (args.length > 1) callback(records[0]); else callback(records);
    }, { acceptableIds: [id], acceptableReasons: ['update'] });
  }

  public upsert(records: UpsertableRecord<T>[]): void;
  public upsert(record: UpsertableRecord<T>): void;
  @bind
  public upsert(recordOrRecords: UpsertableRecord<T> | UpsertableRecord<T>[]): void {
    const records = (is.array(recordOrRecords) ? recordOrRecords : [recordOrRecords]) as T[];
    records.forEach(record => {
      if (is.not.blank(record.id)) return;
      record.id = Math.uniqueId();
    });
    const allIdsSet = this.#getIdsSet();
    const existingRecords = [] as T[];
    const newRecords = [] as T[];
    records.forEach(record => allIdsSet.has(record.id) ? existingRecords.push(record) : newRecords.push(record));
    if (existingRecords.length > 0) this.update(existingRecords);
    if (newRecords.length > 0) this.add(newRecords);
  }

  @bind
  public filter(predicate: (record: T, index: number) => boolean): T[] {
    return this.toArray().filter(predicate);
  }

  @bind
  public find(predicate: (record: T, index: number) => boolean): T | undefined {
    return this.toArray().find(predicate);
  }

  @bind
  public map<R>(predicate: (record: T, index: number) => R): R[] {
    return this.toArray().map(predicate);
  }

  @bind
  public has(id: string): boolean {
    return this.#records.has(id);
  }

  @bind
  public clone(): Records<T> {
    return new Records(this.#records);
  }

  @bind
  public onModified(callback: (records: T[], reason: RecordsModifiedReason, allRecords: T[]) => void, { acceptableIds, acceptableReasons, filterOn }: OnModifiedOptions<T> = {}): () => void {
    const callbackWrapper = (records: T[], reason: RecordsModifiedReason, allRecords: T[]) => {
      if (is.array(acceptableReasons) && !acceptableReasons.includes(reason)) return;
      if (is.array(acceptableIds)) {
        const acceptableIdsSet = new Set(acceptableIds);
        records = records.filter(({ id }) => acceptableIdsSet.has(id));
      }
      if (is.function(filterOn)) records = records.filter(filterOn);
      if (records.length === 0) return;
      callback(records, reason, allRecords);
    };
    this.#onModifiedCallbacks.add(callbackWrapper);
    return () => this.#onModifiedCallbacks.delete(callbackWrapper);
  }

  @bind
  public reorder(ids: string[]): void {
    let records = this.toArray();
    const maxLength = records.length;
    const idToIndex = new Map(ids.map((id, i) => [id, i]));
    records = records.orderBy(({ id }) => idToIndex.get(id) ?? maxLength);
    this.#records = new Map(records.map(record => [record.id, record]));
    this.#invalidateIdsCache();
    this.#invokeCallbacks(records, 'reorder');
  }

  #update(delegate: (record: T, index: number) => T, reason: RecordsModifiedReason): void {
    const updatedRecords: T[] = [];
    let index = 0;
    for (const record of this.#records.values()) {
      const newRecord = delegate(record, index);
      if (!is.deepEqual(record, newRecord)) {
        updatedRecords.push(newRecord);
        this.#records.set(newRecord.id, newRecord);
      }
      index++;
    }
    if (updatedRecords.length === 0) return;
    this.#invokeCallbacks(updatedRecords, reason);
  }

  #invokeCallbacks(records: T[], reason: RecordsModifiedReason): void {
    const allRecords = Array.from(this.#records.values());
    this.#onModifiedCallbacks.forEach(callback => callback(records, reason, allRecords));
  }

}