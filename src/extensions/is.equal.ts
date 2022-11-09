import { createCustomCircularEqual, sameValueZeroEqual, TypeEqualityComparator } from 'fast-equals';

function compareFunctions(valA: unknown, valB: unknown): boolean | undefined {
  if (typeof (valA) !== 'function' || typeof (valB) !== 'function') return;
  return valA.toString() === valB.toString() && valA.name === valB.name;
}

function compareDates(valA: unknown, valB: unknown): boolean | undefined {
  if (!(valA instanceof Date) || !(valB instanceof Date)) return;
  return valA.getTime() === valB.getTime();
}

export function isEqual(value: unknown, other: unknown, isShallow: boolean): boolean {
  const areObjectsEqual: TypeEqualityComparator<any, undefined> = (a, b, internalValidator, meta) => {
    const aKeys = Reflect.ownKeys(a);
    const bKeys = Reflect.ownKeys(b);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (!(
        compareFunctions(a[key], b[key])
        ?? compareDates(a[key], b[key])
        ?? internalValidator(a[key], b[key], key, key, a, b, meta)
      )) return false;
    }
    return true;
  };
  const validator = createCustomCircularEqual(() => ({ areObjectsEqual, ...(isShallow ? { createIsNestedEqual: () => sameValueZeroEqual } : {}) }));
  return validator(value, other);
}
