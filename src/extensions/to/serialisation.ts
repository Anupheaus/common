import { DateTime } from 'luxon';
import { is } from '../is';
import type { AnyObject, ErrorLike } from '../global';
import { Error } from '../../errors';

//#region DateTime
const isSerialisedDateTime = (value: unknown): value is string | Date => (is.string(value) && Date.isIsoString(value)) || value instanceof Date;
const isDateTime = (value: unknown): value is DateTime | Date => DateTime.isDateTime(value) || value instanceof Date;
const deserialiseDateTime = (value: string | Date) => value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(value);
const serialiseDateTime = (value: DateTime | Date): string => DateTime.isDateTime(value) ? value.toUTC().toISO() ?? '' : serialiseDateTime(DateTime.fromJSDate(value));
//#endregion

//#region Error
const isError = (value: unknown): value is ErrorLike => Error.isErrorObject(value) || value instanceof globalThis.Error;
const serialiseError = (value: ErrorLike) => JSON.stringify(value);
const deserialiseError = (value: ErrorLike) => new Error({ error: value });
//#endregion

// ─── Copying objects ───

/**
 * Sets `key` as an own, enumerable data property. Plain assignment would treat a `__proto__` key as the prototype
 * setter, so that one key is defined explicitly to keep it an ordinary entry, as the object spread this replaced did.
 */
function setEntry(target: AnyObject, key: string, value: unknown): void {
  if (key === '__proto__') {
    Object.defineProperty(target, key, { value, enumerable: true, writable: true, configurable: true });
    return;
  }
  target[key] = value;
}

/** Copies an object's own enumerable entries, converting each value, in time proportional to the number of entries. */
function mapEntries(data: AnyObject, convert: (value: unknown) => unknown): AnyObject {
  const result: AnyObject = {};
  for (const [key, value] of Object.entries(data)) setEntry(result, key, convert(value));
  return result;
}

function deserialiseArray(data: any[]) {
  return data.map(value => deserialiseValue(value, false));
}

function deserialiseObject(data: AnyObject) {
  return mapEntries(data, value => deserialiseValue(value, false));
}

function deserialiseValue(value: unknown, viaJSONParse: boolean): unknown {
  if (isSerialisedDateTime(value)) {
    return deserialiseDateTime(value);
  } else if (isError(value)) {
    return deserialiseError(value);
  } else if (Array.isArray(value) && !viaJSONParse) {
    return deserialiseArray(value);
  } else if (typeof value === 'object' && value != null && !viaJSONParse) {
    return deserialiseObject(value);
  }
  return value;
}

export function deserialise(value: unknown, reviver?: (key: string, value: unknown) => unknown): unknown {
  const innerReviver = (viaJSONParse = false) => (key: string, keyValue: unknown) => {
    if (reviver) {
      const newValue = reviver(key, keyValue);
      if (newValue !== undefined) return newValue;
    }
    return deserialiseValue(keyValue, viaJSONParse);
  };
  if (is.string(value)) {
    const trimmedValue = value.trim();
    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) {
      try {
        return JSON.parse(trimmedValue, innerReviver(true));
      } catch {
        throw new Error({ message: 'Failed to deserialise value: invalid JSON' });
      }
    }
  }
  return innerReviver(false)('', value);
}

/**
 * Every array and object `serialiseValue` builds is already fully converted, all the way down. JSON.stringify calls
 * the replacer again on each of their children; recording them here lets that call hand the child straight back
 * instead of copying its whole subtree again at every level (which cost depth × size).
 */
type SerialisedCopies = WeakSet<object>;

/** Whether converting this converted value again would give an equal value: true for anything but an unsettled copy. */
const isSettled = (value: unknown, copies: SerialisedCopies): boolean => typeof value !== 'object' || value == null || copies.has(value);

function serialiseArray(data: any[], copies: SerialisedCopies) {
  const result = data.map(value => serialiseValue(value, copies));
  if (result.every(value => isSettled(value, copies))) copies.add(result);
  return result;
}

function serialiseObject(data: AnyObject, copies: SerialisedCopies) {
  const result = mapEntries(data, value => serialiseValue(value, copies));
  // A class instance carrying an `@error` key only becomes an error object once copied, and converting that copy again
  // turns it into an error string. Such a copy, and every copy holding one, is left unsettled so JSON.stringify
  // converts it again exactly as it always has.
  if (!isError(result) && Object.values(result).every(value => isSettled(value, copies))) copies.add(result);
  return result;
}

function serialiseValue(value: unknown, copies: SerialisedCopies): unknown {
  if (isDateTime(value)) {
    return serialiseDateTime(value);
  } else if (isError(value)) {
    return serialiseError(value);
  } else if (Array.isArray(value)) {
    return serialiseArray(value, copies);
  } else if (typeof value === 'object' && value != null) {
    return serialiseObject(value, copies);
  }
  return value;
}

export function serialise(value: unknown, replacer?: (key: string, value: unknown) => void): string {
  const copies: SerialisedCopies = new WeakSet();
  return JSON.stringify(value, (key, keyValue) => {
    if (replacer) {
      const newValue = replacer(key, keyValue);
      if (newValue !== undefined) return newValue;
    }
    // Converting an already converted copy again gives an equal copy, so the copy itself is returned as it is.
    if (typeof keyValue === 'object' && keyValue != null && copies.has(keyValue)) return keyValue;
    return serialiseValue(keyValue, copies);
  });
}
