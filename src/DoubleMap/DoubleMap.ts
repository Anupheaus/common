export class DoubleMap<K1, K2, V> {
  constructor() {
    this.#data = new Map();
  }

  #data: Map<K1, Map<K2, V>>;

  public get size(): number {
    return this.#data.map((_, map) => map.size).sum();
  }

  public keys(): K1[];
  public keys(key: K1): K2[];
  public keys(...args: unknown[]) {
    if (args.length === 0) return this.#data.toKeysArray();
    const key = args[0] as K1;
    return this.#data.get(key)?.toKeysArray() ?? [];
  }

  public values(): V[] {
    return this.#data.toValuesArray().mapMany(map => map.toValuesArray());
  }

  public clear(key?: K1): void;
  public clear(...args: unknown[]): void {
    if (args.length === 0) {
      this.#data.clear();
    } else {
      const key = args[0] as K1;
      this.#data.delete(key);
    }
  }

  public clone(): DoubleMap<K1, K2, V> {
    const clone = new DoubleMap<K1, K2, V>();
    this.#data.forEach((map, key) => {
      map.forEach((value, key2) => {
        clone.set(key, key2, value);
      });
    });
    return clone;
  }

  public delete(key1: K1, key2?: K2): void;
  public delete(...args: unknown[]): void {
    if (args.length === 1) { this.#data.delete(args[0] as K1); return; }
    const subKeys = this.#data.get(args[0] as K1);
    if (subKeys == null) return;
    subKeys.delete(args[1] as K2);
  }

  public get(key1: K1, key2: K2): V | undefined;
  public get(key1: K1, key2: K2, defaultValue: V): V;
  public get(...args: unknown[]) {
    const key1 = args[0] as K1;
    const key2 = args[1] as K2;
    const defaultValue = args[2] as V;
    const hasDefaultValue = args.length > 2;
    if (!this.#data.has(key1)) {
      if (!hasDefaultValue) return;
      this.#data.set(key1, new Map([[key2, defaultValue]]));
      return defaultValue;
    }
    const map = this.#data.get(key1)!;
    if (!map.has(key2)) {
      if (!hasDefaultValue) return;
      map.set(key2, defaultValue);
      return defaultValue;
    }
    return map.get(key2);
  }

  public set(key1: K1, key2: K2, value: V): void {
    let map = this.#data.get(key1);
    if (map == null) { map = new Map(); this.#data.set(key1, map); }
    map.set(key2, value);
  }

  public has(key1: K1, key2?: K2): boolean;
  public has(...args: unknown[]): boolean {
    if (args.length === 1) return this.#data.has(args[0] as K1);
    return this.#data.get(args[0] as K1)?.has(args[1] as K2) ?? false;
  }

  public forEach(callback: (value: V, key1: K1, key2: K2) => void): void {
    this.#data.forEach((map, key1) => map.forEach((value, key2) => callback(value, key1, key2)));
  }

  public toMap(): Map<K1, Map<K2, V>> {
    return this.#data.clone();
  }

  public map<R>(callback: (value: V, key1: K1, key2: K2) => R): R[] {
    const results = [] as R[];
    this.forEach((value, key1, key2) => results.push(callback(value, key1, key2)));
    return results;
  }

}