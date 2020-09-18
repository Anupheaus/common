import './object';

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

}

Object.extendPrototype(Map.prototype, MapExtensions.prototype);

declare global { interface Map<K, V> extends MapExtensions<K, V> { } }
