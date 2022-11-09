/* eslint-disable max-classes-per-file */
import './object';
import { MapOf } from './global';
import { is } from './is';

interface MergeOptions<K, T, R, V> {
  mapMatchedTo?(firstItem: T, secondItem: R, key: K): V;
  mapUnmatchedLeftTo?(firstItem: T, key: K): V | undefined;
  mapUnmatchedRightTo?(secondItem: R, key: K): V | undefined;
}

interface ArrayMergeOptions<K, T, R, V> extends MergeOptions<K, T, R, V> {
  keyExtractor(item: T): K;
}

class MapExtensions<K, V> {

  public toArray(): [K, V][];
  public toArray(this: Map<K, V>): [K, V][] {
    return Array.from(this.entries());
  }

  public toKeysArray(): K[];
  public toKeysArray(this: Map<K, V>): K[] {
    return Array.from(this.keys());
  }

  public toValuesArray(): V[];
  public toValuesArray(this: Map<K, V>): V[] {
    return Array.from(this.values());
  }

  public merge<R>(other: V[], options: ArrayMergeOptions<K, V, V, R>): Map<K, R>;
  public merge<R>(other: Map<K, V>, options: MergeOptions<K, V, V, R>): Map<K, R>;
  public merge<R>(this: Map<K, V>, other: Map<K, V> | V[], options: ArrayMergeOptions<K, V, V, R>): Map<K, V> {
    if (other instanceof Map) for (const [key, value] of other) this.set(key, value);
    const ignoredKeys: K[] = [];
    if (other instanceof Array) other.forEach(item => {
      const key = options.keyExtractor(item);
      ignoredKeys.push(key);
      let newItem: V | undefined = undefined;

      if (this.has(key)) {
        const thisItem = this.get(key)!;
        if (is.deepEqual(thisItem, item)) return;
        newItem = options.mapMatchedTo?.(thisItem, item, key) as V | undefined;
        if (newItem == null) return;
      } else {
        newItem = options.mapUnmatchedRightTo?.(item, key) as V | undefined;
      }
      if (newItem != null) this.set(key, newItem);
    });
    this.forEach((value, key) => {
      if (ignoredKeys.includes(key)) return;
      const newItem = options.mapUnmatchedLeftTo?.(value, key) as V | undefined;
      if (newItem != null) this.set(key, newItem);
    });
    return this;
  }

  public clone(): Map<K, V>;
  public clone(this: Map<K, V>): Map<K, V> {
    return new Map(this);
  }

  public getOrSet(key: K, defaultValue: () => V): V;
  public getOrSet(this: Map<K, V>, key: K, defaultValue: () => V): V {
    if (this.has(key)) return this.get(key)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const value = defaultValue();
    this.set(key, value);
    return value;
  }

}

class MapConstructorExtensions {

  public fromPlainObject<V>(object: MapOf<V>): Map<string, V> {
    if (!is.plainObject(object)) throw new Error('Unable to convert provided object to a map, the object was either invalid or missing.');
    return new Map(Object.entries(object));
  }

}

Object.extendPrototype(Map.prototype, MapExtensions.prototype);
Object.extendPrototype(Map, MapConstructorExtensions.prototype);

declare global {
  interface Map<K, V> extends MapExtensions<K, V> { }
  interface MapConstructor extends MapConstructorExtensions { }
}
