import type { TypeEqualityComparator } from 'fast-equals';
import { createCustomCircularEqual, sameValueZeroEqual } from 'fast-equals';
import { DateTime } from 'luxon';

export interface IsEqualOptions {
  ignoreUndefined?: boolean;
}

function compareFunctions(valA: unknown, valB: unknown): boolean | undefined {
  if (typeof (valA) !== 'function' && typeof (valB) !== 'function') return;
  if (typeof (valA) !== 'function' || typeof (valB) !== 'function') return false;
  return valA.toString() === valB.toString() && valA.name === valB.name;
}

function compareDates(valA: unknown, valB: unknown): boolean | undefined {
  if (valA instanceof Date || valB instanceof Date) {
    if (!(valA instanceof Date) || !(valB instanceof Date)) return false;
    return valA.getTime() === valB.getTime();
  }
  if (DateTime.isDateTime(valA) || DateTime.isDateTime(valB)) {
    if (!(DateTime.isDateTime(valA)) || !(DateTime.isDateTime(valB))) return false;
    return valA.equals(valB);
  }
}

function compareReactNodes(valA: unknown, valB: unknown, isShallow: boolean): boolean | undefined {
  if ((typeof (valA) !== 'object' || valA == null) && (typeof (valB) !== 'object' || valB == null)) return;
  if ((typeof (valA) !== 'object' || valA == null) || (typeof (valB) !== 'object' || valB == null)) return false;
  const nodeA = valA as any;
  const nodeB = valB as any;
  if (nodeA.constructor.name === 'FiberNode' || nodeB.constructor.name === 'FiberNode') {
    if (nodeA.constructor.name !== 'FiberNode' || nodeB.constructor.name !== 'FiberNode') return false;
    if (nodeA.type?.name !== nodeB.type?.name) return false;
    if (nodeA.key !== nodeB.key) return false;
    return isEqual(nodeA.pendingProps, nodeB.pendingProps, isShallow);
  }
  if (nodeA.$$typeof != null || nodeB.$$typeof != null) {
    if (nodeA.$$typeof !== nodeB.$$typeof) return false;
    if (nodeA.key !== nodeB.key) return false;
    if (nodeA.type?.name !== nodeB.type?.name) return false;
    return isEqual(nodeA.props, nodeB.props, isShallow);
  }
}

function getKeys(value: unknown, ignoreUndefined: boolean): (string | symbol)[] {
  if (typeof value !== 'object' || value == null) return [];
  const keys = Reflect.ownKeys(value);
  if (ignoreUndefined) return keys.filter(key => value[key as keyof typeof value] !== undefined);
  return keys;
}

export function isEqual(value: unknown, other: unknown, isShallow: boolean, { ignoreUndefined = true }: IsEqualOptions = {}): boolean {
  const areObjectsEqual: TypeEqualityComparator<any, undefined> = (a, b, internalValidator, meta) => {
    const aKeys = getKeys(a, ignoreUndefined);
    const bKeys = getKeys(b, ignoreUndefined);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (a[key] === b[key]) continue;
      if (!(
        compareFunctions(a[key], b[key])
        ?? compareDates(a[key], b[key])
        ?? compareReactNodes(a[key], b[key], isShallow)
        ?? internalValidator(a[key], b[key], key, key, a, b, meta)
      )) return false;
    }
    return true;
  };
  const validator = createCustomCircularEqual(() => ({ areObjectsEqual, ...(isShallow ? { createIsNestedEqual: () => sameValueZeroEqual } : {}) }));
  return validator(value, other);
}
