import { Event } from '../events';
import type { PromiseMaybe, Record } from '../extensions';
import { is } from '../extensions';
import type { AddIsNewFlagToRecord, ArrayModificationsApplyToOptions } from './ArrayModificationsModels';

export interface SerialisedArrayModifications<RecordType extends Record = Record> {
  added: RecordType[];
  updated: RecordType[];
  removed: string[];
}

export class ArrayModifications<RecordType extends Record>  {
  constructor() {
    this.#added = new Map();
    this.#updated = new Map();
    this.#removed = new Set();
  }

  #added: Map<string, RecordType>;
  #updated: Map<string, RecordType>;
  #removed: Set<string>;

  public onCanAdd = Event.create<() => PromiseMaybe<boolean>>();
  public onCanUpdate = Event.create<() => PromiseMaybe<boolean>>();
  public onCanRemove = Event.create<() => PromiseMaybe<boolean>>();

  public onAdded = Event.create<(record: RecordType) => PromiseMaybe<void>>();
  public onUpdated = Event.create<(record: RecordType) => PromiseMaybe<void>>();
  public onRemoved = Event.create<(id: string) => PromiseMaybe<void>>();
  public onCleared = Event.create<() => PromiseMaybe<void>>();
  public onModified = Event.create<(modifications: SerialisedArrayModifications<RecordType>) => PromiseMaybe<void>>();

  public add(record: RecordType): void {
    this.#added.set(record.id, record);
    Event.raise(this.onAdded, record);
    Event.raise(this.onModified, { added: [record], updated: [], removed: [] });
  }

  public update(record: RecordType): void {
    this.#updated.set(record.id, record);
    Event.raise(this.onUpdated, record);
    Event.raise(this.onModified, { added: [], updated: [record], removed: [] });
  }

  public remove(id: string): void;
  public remove(record: RecordType): void;
  public remove(recordOrId: string | RecordType): void {
    if (recordOrId == null) return;
    const id = is.not.empty(recordOrId) ? recordOrId : (recordOrId as RecordType).id;
    this.#removed.add(id);
    Event.raise(this.onRemoved, id);
    Event.raise(this.onModified, { added: [], updated: [], removed: [id] });
  }

  public async canAdd(): Promise<boolean> {
    const results = await Event.raise(this.onCanAdd);
    return results.every(result => result === true);
  }

  public async canUpdate(): Promise<boolean> {
    const results = await Event.raise(this.onCanUpdate);
    return results.every(result => result === true);
  }

  public async canRemove(): Promise<boolean> {
    const results = await Event.raise(this.onCanRemove);
    return results.every(result => result === true);
  }

  public applyTo(array: RecordType[], { applyAddedAtTheEnd = false }: ArrayModificationsApplyToOptions = {}): AddIsNewFlagToRecord<RecordType>[] {
    let { added, removed, updated } = this.toJSON();
    added = added.map(record => ({ ...record, isNew: true }));
    let newRecords = array.filter(({ id }) => !removed.includes(id));
    newRecords = newRecords.map(record => updated.findById(record.id) ?? record);
    newRecords = applyAddedAtTheEnd ? newRecords.concat(added) : added.concat(newRecords);
    return newRecords;
  }

  public clear(): void {
    this.#added.clear();
    this.#updated.clear();
    this.#removed.clear();
    Event.raise(this.onCleared);
    Event.raise(this.onModified, { added: [], updated: [], removed: [] });
  }

  public toJSON(): SerialisedArrayModifications<RecordType> {
    return {
      added: Array.from(this.#added.values()),
      updated: Array.from(this.#updated.values()),
      removed: Array.from(this.#removed.values()),
    };
  }
}