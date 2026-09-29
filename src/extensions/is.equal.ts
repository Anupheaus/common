import { createCustomEqual, sameValueZeroEqual } from 'fast-equals';
import type { EqualityComparator } from 'fast-equals';
import { DateTime } from 'luxon';
import { sameInstant } from './datetime';

export interface IsEqualOptions {
  ignoreUndefined?: boolean;
}

function compareFunctions(valA: unknown, valB: unknown): boolean | undefined {
  if (typeof (valA) !== 'function' && typeof (valB) !== 'function') return;
  if (typeof (valA) !== 'function' || typeof (valB) !== 'function') return false;
  return valA.toString() === valB.toString() && valA.name === valB.name;
}

/**
 * Dates and Luxon DateTimes compare by instant — never by their fields, which differ with the zone and with what luxon
 * caches once a DateTime is read (its week data). Two invalid ones are equal when invalid alike (both NaN Dates, or
 * DateTimes invalid for the same reason), so a record with one never reads as changed on every comparison. Undefined
 * when neither value is a date, so the caller compares them some other way.
 */
function compareDates(valA: unknown, valB: unknown): boolean | undefined {
  if (valA instanceof Date || valB instanceof Date) {
    if (!(valA instanceof Date) || !(valB instanceof Date)) return false;
    const [timeA, timeB] = [valA.getTime(), valB.getTime()];
    return timeA === timeB || (Number.isNaN(timeA) && Number.isNaN(timeB));
  }
  if (DateTime.isDateTime(valA) || DateTime.isDateTime(valB)) {
    if (!(DateTime.isDateTime(valA)) || !(DateTime.isDateTime(valB))) return false;
    if (!valA.isValid || !valB.isValid) return !valA.isValid && !valB.isValid && valA.invalidReason === valB.invalidReason;
    return sameInstant(valA, valB);
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
  const topLevelDateCompare = compareDates(value, other);
  if (topLevelDateCompare != null) return topLevelDateCompare;

  const areObjectsEqual: EqualityComparator<undefined> = (a, b, state) => {
    const aKeys = getKeys(a, ignoreUndefined);
    const bKeys = getKeys(b, ignoreUndefined);
    if (aKeys.length !== bKeys.length) return false;
    for (const key of aKeys) {
      if (a[key] === b[key]) continue;
      if (!(
        compareFunctions(a[key], b[key])
        ?? compareDates(a[key], b[key])
        ?? compareReactNodes(a[key], b[key], isShallow)
        ?? state.equals(a[key], b[key], key, key, a, b, state)
      )) return false;
    }
    return true;
  };
  const validator = createCustomEqual<undefined>({
    circular: true,
    createCustomConfig: config => ({ ...config, areObjectsEqual }),
    // Every nested comparison (array elements too, not only object properties) compares dates by instant first. For
    // shallow equality anything else nested is compared by identity rather than recursed into.
    createInternalComparator: compare => (a, b, _keyA, _keyB, _parentA, _parentB, state) =>
      compareDates(a, b) ?? (isShallow ? sameValueZeroEqual(a, b) : compare(a, b, state)),
  });
  return validator(value, other);
}
