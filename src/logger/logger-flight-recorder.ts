import type { DateTime } from 'luxon';
import { v4 as uuid } from 'uuid';
import type { AnyObject } from '../extensions/global';
import { nodeBuiltin } from './nodeBuiltins';
import type { LoggerEntry } from './logger-listener';
import { createRedactor, DEFAULT_REDACTED_KEYS } from './logger-redaction';

/** A message that is only built if the entry is actually delivered somewhere. */
export type LogMessage = string | (() => string);

/** Meta that is only built if the entry is actually delivered somewhere. */
export type LogMeta = AnyObject | (() => AnyObject);

/** An entry as the flight recorder holds it: raw until something needs it as text. */
export interface RecordedEntry {
  /** 1-based and rising within one buffer: what "already delivered" is measured against. */
  seq: number;
  timestamp: DateTime;
  level: number;
  names: string[];
  message: LogMessage;
  meta?: LogMeta;
  /** The scope's id; absent for entries logged outside every scope. */
  scopeId?: string;
  resolved?: LoggerEntry;
}

export interface FlightRecorderSettings {
  /** Entries of every level kept per scope. Default 200. */
  bufferSize?: number;
  /** Entries kept for code outside any scope (and per root logger in the browser). Default 50. */
  sharedBufferSize?: number;
  /** Meta keys redacted at write time, instead of the defaults (`password`, `token`, `authorization`, `cookie`, `credential`, `privateKey`, `prf`, `secret`). */
  redactedKeys?: string[];
}

export interface LogScopeOptions {
  /** The scope's id, tagged on every entry logged inside it. Default a new uuid. */
  id?: string;
  /** Overrides `bufferSize` for this scope. */
  bufferSize?: number;
}

/** The last N entries of every level for one scope. */
export interface ScopeBuffer {
  readonly id: string | undefined;
  /** Adds an entry, dropping the oldest once full, and returns it with its sequence number. */
  push(entry: Omit<RecordedEntry, 'seq' | 'scopeId'>): RecordedEntry;
  /** Oldest first. */
  entries(): RecordedEntry[];
}

const DEFAULT_BUFFER_SIZE = 200;
const DEFAULT_SHARED_BUFFER_SIZE = 50;

let settings: Required<FlightRecorderSettings> = {
  bufferSize: DEFAULT_BUFFER_SIZE,
  sharedBufferSize: DEFAULT_SHARED_BUFFER_SIZE,
  redactedKeys: [...DEFAULT_REDACTED_KEYS],
};
let redact = createRedactor(settings.redactedKeys);
let sharedBuffer: ScopeBuffer | undefined;
let rootBuffers = new WeakMap<object, ScopeBuffer>();

export function configureFlightRecorder(newSettings: FlightRecorderSettings): void {
  settings = { ...settings, ...newSettings };
  redact = createRedactor(settings.redactedKeys);
  // The out-of-scope buffers were sized by the old settings: start them afresh.
  sharedBuffer = undefined;
  rootBuffers = new WeakMap();
}

/** Meta with its secrets replaced; lazy meta is redacted when it is built. */
export function redactMeta(meta: LogMeta | undefined): LogMeta | undefined {
  if (meta == null) return undefined;
  if (typeof meta === 'function') return () => redact(meta());
  return redact(meta);
}

export function createScopeBuffer(id: string | undefined, size: number): ScopeBuffer {
  const capacity = Math.max(1, Math.floor(size));
  const slots: (RecordedEntry | undefined)[] = new Array(capacity).fill(undefined);
  let nextSeq = 1;

  return {
    id,
    push: entry => {
      const recorded: RecordedEntry = { ...entry, seq: nextSeq, ...(id != null ? { scopeId: id } : {}) };
      slots[(nextSeq - 1) % capacity] = recorded;
      nextSeq++;
      return recorded;
    },
    entries: () => {
      const count = Math.min(nextSeq - 1, capacity);
      const first = nextSeq - 1 - count;
      return Array.from({ length: count }, (_, offset) => slots[(first + offset) % capacity]!);
    },
  };
}

// ─── Scopes ───

interface ScopeStorage {
  getStore(): ScopeBuffer | undefined;
  run<T>(buffer: ScopeBuffer, delegate: () => T): T;
}

let scopeStorage: ScopeStorage | undefined;

/** The Node scope store, or undefined where there is none (the browser, or a Node too old for `getBuiltinModule`). */
function getScopeStorage(): ScopeStorage | undefined {
  if (globalThis.process?.getBuiltinModule == null) return undefined;
  if (scopeStorage != null) return scopeStorage;
  const { AsyncLocalStorage } = nodeBuiltin('async_hooks');
  scopeStorage = new AsyncLocalStorage<ScopeBuffer>() as ScopeStorage;
  return scopeStorage;
}

/**
 * Runs `delegate` in its own logging scope: its entries (and those of everything it awaits) get their own buffer, so an
 * error's trail is that request's and nobody else's. Without async context (the browser) it just runs `delegate`.
 */
export function runInLogScope<T>(delegate: () => T, { id = uuid(), bufferSize }: LogScopeOptions = {}): T {
  const storage = getScopeStorage();
  if (storage == null) return delegate();
  return storage.run(createScopeBuffer(id, bufferSize ?? settings.bufferSize), delegate);
}

export function getCurrentScopeId(): string | undefined {
  return getScopeStorage()?.getStore()?.id;
}


/**
 * The buffer an entry goes into: the current scope's; failing that, a small shared one on Node, or one per root logger
 * in the browser, which has no async context to tell requests apart.
 */
export function getActiveBuffer(rootLogger: object): ScopeBuffer {
  const storage = getScopeStorage();
  const scoped = storage?.getStore();
  if (scoped != null) return scoped;
  if (storage != null) {
    sharedBuffer ??= createScopeBuffer(undefined, settings.sharedBufferSize);
    return sharedBuffer;
  }
  let rootBuffer = rootBuffers.get(rootLogger);
  if (rootBuffer == null) {
    rootBuffer = createScopeBuffer(undefined, settings.bufferSize);
    rootBuffers.set(rootLogger, rootBuffer);
  }
  return rootBuffer;
}

// ─── Resolving ───

/** A logging call must never throw because a lazy message did. */
function build<T>(source: T | (() => T), describe: (reason: string) => T): T {
  if (typeof source !== 'function') return source;
  try {
    return (source as () => T)();
  } catch (error) {
    return describe(error instanceof Error ? error.message : String(error));
  }
}

/** The entry as listeners see it, building lazy message and meta the first time (once, however many listeners). */
export function resolveEntry(recorded: RecordedEntry): LoggerEntry {
  if (recorded.resolved != null) return recorded.resolved;
  const { timestamp, level, names, message, meta, scopeId } = recorded;
  const resolvedMeta = meta == null ? undefined : build(meta, reason => ({ metaError: reason }));
  recorded.resolved = {
    timestamp,
    level,
    names,
    message: build(message, reason => `[log message failed: ${reason}]`),
    ...(resolvedMeta != null ? { meta: resolvedMeta } : {}),
    ...(scopeId != null ? { scopeId } : {}),
  };
  return recorded.resolved;
}
