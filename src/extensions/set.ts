import './object';

declare global {
  interface Set<T> extends SetExtensions<T> { }
}

class SetExtensions<T> {

  public map<V>(iterator: (value: T, index: number, set: Set<T>) => V): Set<V>;
  public map<V>(this: Set<T>, iterator: (value: T, index: number, set: Set<T>) => V): Set<V> {
    const newSet = new Set<V>();
    let index = 0;
    this.forEach((value, ignore, set) => {
      newSet.add(iterator(value, index, set));
      index++;
    });
    return newSet;
  }

  public filter(iterator: (value: T, index: number, set: Set<T>) => boolean): Set<T>;
  public filter(this: Set<T>, iterator: (value: T, index: number, set: Set<T>) => boolean): Set<T> {
    const newSet = new Set<T>();
    let index = 0;
    this.forEach((value, ignore, set) => {
      if (iterator(value, index, set)) newSet.add(value);
      index++;
    });
    return newSet;
  }

  public toArray(): T[];
  public toArray(this: Set<T>): T[] {
    return Array.from(this);
  }

}

Object.extendPrototype(Set, SetExtensions.prototype);
