/* eslint-disable max-classes-per-file */
import './object';
import { MapOf } from './global';
import { is } from './is';

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
