import { is, Record, UpsertableRecord } from '../extensions';

export type RecordsModifiedReason = 'add' | 'remove' | 'update' | 'clear';

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
    this.#records = (is.array(records) ? records : records instanceof Map ? Array.from(records.values()) : undefined) ?? [];
    this.#onModifiedCallbacks = new Set();
  }

  #records: T[];
  #onModifiedCallbacks: Set<(records: T[], reason: RecordsModifiedReason) => void>;

  public get length(): number {
    return this.#records.length;
  }

  public get isEmpty(): boolean {
    return this.#records.length === 0;
  }

  public ids(): string[] {
    return this.#records.ids();
  }

  public add(records: T[]): void;
  public add(record: T): void;
  public add(recordOrRecords: T | T[]): void {
    const records = is.array(recordOrRecords) ? recordOrRecords : [recordOrRecords];
    const newRecords: T[] = [];
    records.forEach(record => {
      if (!is.string(record.id)) throw new Error('Unable to add record. No valid id found on the record.');
      newRecords.push(record);
    });
    if (newRecords.length === 0) return;
    this.#records.push(...newRecords);
    this.#invokeCallbacks(newRecords, 'add');
  }

  public onAdded(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['add'] });
  }

  public get(id: string): T | undefined {
    return this.#records.find(record => record.id === id);
  }

  public toArray(): T[] {
    return this.#records.slice();
  }

  public toMap(): Map<string, T> {
    return new Map(this.#records.map(record => [record.id, record]));
  }

  public remove(ids: string[]): void;
  public remove(id: string): void;
  public remove(records: T[]): void;
  public remove(record: T): void;
  public remove(arg: string | string[] | T | T[]): void {
    const ids = is.string(arg) ? [arg] : is.array(arg) ? arg.map(value => is.string(value) ? value : value.id) : [arg.id];
    const recordsToRemove = this.#records.filter(record => ids.includes(record.id));
    if (recordsToRemove.length === 0) return;
    this.#records = this.#records.filter(record => !recordsToRemove.includes(record));
    this.#invokeCallbacks(recordsToRemove, 'remove');
  }

  public onRemoved(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['remove'] });
  }

  public clear(): void {
    const oldRecords = this.#records.slice();
    this.#records = [];
    this.#invokeCallbacks(oldRecords, 'clear');
  }

  public onCleared(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['clear'] });
  }

  public update(records: T[]): void;
  public update(record: T): void;
  public update(ids: string[], predicate: (record: T) => T): void;
  public update(id: string, predicate: (record: T) => T): void;
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
    this.#update(record => ids.includes(record.id) ? predicate(record) : record, 'update');
  }

  public onUpdated(callback: (records: T[]) => void): () => void {
    return this.onModified(records => callback(records), { acceptableReasons: ['update'] });
  }

  public upsert(records: UpsertableRecord<T>[]): void;
  public upsert(record: UpsertableRecord<T>): void;
  public upsert(recordOrRecords: UpsertableRecord<T> | UpsertableRecord<T>[]): void {
    const records = (is.array(recordOrRecords) ? recordOrRecords : [recordOrRecords]) as T[];
    records.forEach(record => {
      if (is.not.empty(record.id)) return;
      record.id = Math.uniqueId();
    });
    const allIds = this.#records.ids();
    const existingRecords = [] as T[];
    const newRecords = [] as T[];
    records.forEach(record => allIds.includes(record.id) ? existingRecords.push(record) : newRecords.push(record));
    if (existingRecords.length > 0) this.update(existingRecords);
    if (newRecords.length > 0) this.add(newRecords);
  }

  public filter(predicate: (record: T, index: number) => boolean): T[] {
    return this.#records.filter(predicate);
  }

  public find(predicate: (record: T, index: number) => boolean): T | undefined {
    return this.#records.find(predicate);
  }

  public map<R>(predicate: (record: T, index: number) => R): R[] {
    return this.#records.map(predicate);
  }

  public onModified(callback: (records: T[], reason: RecordsModifiedReason) => void, { acceptableIds, acceptableReasons, filterOn }: OnModifiedOptions<T> = {}): () => void {
    const callbackWrapper = (records: T[], reason: RecordsModifiedReason) => {
      if (is.array(acceptableReasons) && !acceptableReasons.includes(reason)) return;
      if (is.array(acceptableIds)) records = records.filter(({ id }) => acceptableIds.includes(id));
      if (is.function(filterOn)) records = records.filter(filterOn);
      callback(records, reason);
    };
    this.#onModifiedCallbacks.add(callbackWrapper);
    return () => this.#onModifiedCallbacks.delete(callbackWrapper);
  }

  #update(delegate: (record: T, index: number) => T, reason: RecordsModifiedReason): void {
    const updatedRecords: T[] = [];
    this.#records = this.#records.map((record, index) => {
      const newRecord = delegate(record, index);
      if (is.deepEqual(record, newRecord)) return record;
      updatedRecords.push(newRecord);
      return newRecord;
    });
    this.#invokeCallbacks(updatedRecords, reason);
  }

  #invokeCallbacks(records: T[], reason: RecordsModifiedReason): void {
    this.#onModifiedCallbacks.forEach(callback => callback(records, reason));
  }

}