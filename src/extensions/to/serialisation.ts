import { DateTime } from 'luxon';
import { is } from '../is';
import { AnyObject, ErrorLike } from '../global';
import { Error } from '../../errors';

//#region DateTime
const isoDateRegex = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(\.\d+)?(([+-]\d\d:\d\d)|Z)?$/i;
const isSerialisedDateTime = (value: unknown): value is string | Date => (is.string(value) && isoDateRegex.test(value)) || value instanceof Date;
const isDateTime = (value: unknown): value is DateTime | Date => DateTime.isDateTime(value) || value instanceof Date;
const deserialiseDateTime = (value: string | Date) => value instanceof Date ? DateTime.fromJSDate(value) : DateTime.fromISO(value);
const serialiseDateTime = (value: DateTime | Date): string => DateTime.isDateTime(value) ? value.toUTC().toISO() ?? '' : serialiseDateTime(DateTime.fromJSDate(value));
//#endregion

//#region Error
const isError = (value: unknown): value is ErrorLike => Error.isErrorObject(value) || value instanceof globalThis.Error;
const serialiseError = (value: ErrorLike) => JSON.stringify(value);
const deserialiseError = (value: ErrorLike) => new Error(value);
//#endregion

function deserialiseArray(data: any[]) {
  return data.map(value => deserialiseValue(value, false));
}

function deserialiseObject(data: AnyObject) {
  return Object.entries(data).reduce((map, [key, value]) => ({
    ...map,
    [key]: deserialiseValue(value, false),
  }), {});
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
    if (trimmedValue.startsWith('{') || trimmedValue.startsWith('[')) return JSON.parse(trimmedValue, innerReviver(true));
  }
  return innerReviver(false)('', value);
}

function serialiseArray(data: any[]) {
  return data.map(value => serialiseValue(value));
}

function serialiseObject(data: AnyObject) {
  return Object.entries(data).reduce((map, [key, value]) => ({
    ...map,
    [key]: serialiseValue(value),
  }), {});
}

function serialiseValue(value: unknown): unknown {
  if (isDateTime(value)) {
    return serialiseDateTime(value);
  } else if (isError(value)) {
    return serialiseError(value);
  } else if (Array.isArray(value)) {
    return serialiseArray(value);
  } else if (typeof value === 'object' && value != null) {
    return serialiseObject(value);
  }
  return value;
}

export function serialise(value: unknown, replacer?: (key: string, value: unknown) => void): string {
  return JSON.stringify(value, (key, keyValue) => {
    if (replacer) {
      const newValue = replacer(key, keyValue);
      if (newValue !== undefined) return newValue;
    }
    return serialiseValue(keyValue);
  });
}
