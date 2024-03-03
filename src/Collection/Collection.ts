import { Unsubscribe } from '../events';
import { is } from '../extensions';

type CollectionModifiedReason = 'add' | 'remove' | 'clear';

export class Collection<T> {
  public constructor();
  public constructor(items: T[]);
  public constructor(items?: T[]) {
    this.#items = new Set(items ?? []);
    this.#callbacks = new Set();
  }

  #items: Set<T>;
  #callbacks: Set<(items: T[], reason: CollectionModifiedReason) => void>;

  public get length(): number { return this.#items.size; }

  public add(item: T): void;
  public add(items: T[]): void;
  public add(itemOrItems: T[] | T): void {
    const items = (is.array(itemOrItems) ? itemOrItems : [itemOrItems])
      .filter(item => !this.#items.has(item));
    if (items.length === 0) return;
    items.forEach(item => this.#items.add(item));
    this.#raiseEvent(items, 'add');
  }

  public remove(item: T): void;
  public remove(items: T[]): void;
  public remove(itemOrItems: T[] | T): void {
    const items = (is.array(itemOrItems) ? itemOrItems : [itemOrItems])
      .filter(item => this.#items.has(item));
    if (items.length === 0) return;
    items.forEach(item => this.#items.delete(item));
    this.#raiseEvent(items, 'remove');
  }

  public has(item: T): boolean {
    return this.#items.has(item);
  }
  public get(): T[];
  public get(index: number): T | undefined;
  public get(index?: number): any {
    const allItems = Array.from(this.#items);
    return index == null ? allItems : allItems[index];
  }

  public clear(): void {
    const items = Array.from(this.#items);
    this.#items.clear();
    this.#raiseEvent(items, 'clear');
  }

  public onModified(callback: (items: T[], reason: CollectionModifiedReason) => void): Unsubscribe {
    this.#callbacks.add(callback);
    return () => this.#callbacks.delete(callback);
  }

  public onAdded(callback: (items: T[]) => void): Unsubscribe {
    return this.onModified((items, reason) => {
      if (reason === 'add') callback(items);
    });
  }

  public onRemoved(callback: (items: T[]) => void): Unsubscribe {
    return this.onModified((items, reason) => {
      if (reason === 'remove') callback(items);
    });
  }

  public onCleared(callback: (items: T[]) => void): Unsubscribe {
    return this.onModified((items, reason) => {
      if (reason === 'clear') callback(items);
    });
  }

  #raiseEvent(items: T[], reason: CollectionModifiedReason): void {
    this.#callbacks.forEach(callback => callback(items, reason));
  }

}