import type { AnyObject } from '../extensions/global';

/** What replaces a redacted value. */
export const REDACTED_VALUE = '[redacted]';

/**
 * Meta keys whose values never reach a buffer, a listener or the console. A key matches when, ignoring case, `-` and
 * `_`, it equals one of these or ends with one (`accessToken`, `client_secret`, `userPassword`). Ending with, not
 * containing, keeps `credentialId` and `tokenCount`, which are useful and harmless.
 */
export const DEFAULT_REDACTED_KEYS: readonly string[] = [
  'password', 'token', 'authorization', 'cookie', 'credential', 'privatekey', 'prf', 'secret',
];

/** Deeper than any real meta; stops a runaway structure costing more than it is worth. */
const MAX_DEPTH = 8;

const normaliseKey = (key: string): string => key.toLowerCase().replace(/[-_]/g, '');

/**
 * Builds the redactor the logger applies to meta at write time, before an entry enters a buffer.
 * It copies plain objects and arrays (the caller's own meta is never changed) and passes everything else through
 * as it is: an `Error`, a `DateTime` or any class instance is not walked. Cycles are cut and marked.
 */
export function createRedactor(redactedKeys: readonly string[] = DEFAULT_REDACTED_KEYS): (meta: AnyObject) => AnyObject {
  const terms = redactedKeys.map(normaliseKey);
  const isSensitive = (key: string): boolean => {
    const normalised = normaliseKey(key);
    return terms.some(term => normalised.endsWith(term));
  };

  const redactValue = (value: unknown, depth: number, ancestors: Set<object>): unknown => {
    if (value == null || typeof value !== 'object') return value;
    const isArray = Array.isArray(value);
    if (!isArray && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) return value;
    if (ancestors.has(value)) return '[circular]';
    if (depth >= MAX_DEPTH) return '[too deep]';
    ancestors.add(value);
    try {
      if (isArray) return value.map(inner => redactValue(inner, depth + 1, ancestors));
      return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, isSensitive(key) ? REDACTED_VALUE : redactValue(inner, depth + 1, ancestors)]));
    } finally {
      ancestors.delete(value);
    }
  };

  return meta => redactValue(meta, 0, new Set()) as AnyObject;
}
