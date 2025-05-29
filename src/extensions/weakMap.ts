/* eslint-disable max-classes-per-file */
import './object';

class WeakMapExtensions<K extends WeakKey, V> {


  public getOrSet(key: K, defaultValue: () => V): V;
  public getOrSet(this: WeakMap<K, V>, key: K, defaultValue: () => V): V {
    if (this.has(key)) return this.get(key)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
    const value = defaultValue();
    this.set(key, value);
    return value;
  }

}

Object.extendPrototype(WeakMap.prototype, WeakMapExtensions.prototype);

declare global {
  interface WeakMap<K, V> extends WeakMapExtensions<K, V> { }
}
