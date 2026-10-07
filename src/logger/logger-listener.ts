import { DateTime } from 'luxon';
import type { AnyObject } from '../extensions';
import type { RecordedEntry, ScopeBuffer } from './logger-flight-recorder';
import { resolveEntry } from './logger-flight-recorder';
import { LogLevels } from './logger-utils';

export interface LoggerEntry {
  timestamp: DateTime;
  level: number;
  names: string[];
  message: string;
  meta?: AnyObject;
  /** The logging scope (request, socket action, job) the entry was logged in; the same on a trail and its error. */
  scopeId?: string;
  /** True for an entry delivered late, as context for an error that followed it. */
  preceding?: true;
}

/** What a listener's `minLevel` function is told about the entry it decides for. */
export interface LoggerLevelContext {
  level: number;
  names: string[];
  /** The logging scope the entry was logged in, if any. */
  scopeId?: string;
}

/**
 * Decides, per entry, the lowest level a listener takes as it happens. Called synchronously while the entry is logged,
 * in the logging caller's async context, so it can read request state (the current scope, a tenant) to choose a level.
 * Must be cheap: it runs for every entry.
 */
export type LoggerListenerMinLevel = (entry: LoggerLevelContext) => number;

export interface LoggerListenerSettings {
  sendInterval?: {
    minutes?: number;
    seconds?: number;
  };
  maxEntries?: number;
  /**
   * The lowest level delivered as it happens. Default 0: every entry. Entries below it are held in their scope's flight
   * recorder and delivered only as the trail of an error (see `flushLevel`). A function decides it per entry (levels
   * changed at runtime, per tenant or per logger); one that throws counts as 0, so no entry is lost.
   */
  minLevel?: number | LoggerListenerMinLevel;
  /** An entry at or above this level flushes the scope's undelivered lower-level entries first. Default error. */
  flushLevel?: number;
  /** At most one flush per scope in this time (storm guard). Default 10,000. */
  flushIntervalMs?: number;
  onTrigger(entries: LoggerEntry[]): void;
}

const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

interface FlushTrailRequest {
  error: RecordedEntry;
  buffer: ScopeBuffer;
  /** The level decided for the error: the trail is what the scope logged below it. */
  minLevel: number;
}

interface FlushState {
  /** Everything in the scope up to here has been delivered or flushed. */
  lastSeq: number;
  lastAt: number;
}

export class LoggerListener {
  constructor(settings: LoggerListenerSettings) {
    this.#settings = settings;
    this.#entries = [];
    this.#lastSendTimestamp = DateTime.now().valueOf();
    this.#interval = (((this.#settings.sendInterval?.minutes ?? 0) * 60) + (this.#settings.sendInterval?.seconds ?? 0)) * 1000;
  }

  #settings: LoggerListenerSettings;
  #entries: LoggerEntry[];
  #lastSendTimestamp: number;
  #timerId: NodeJS.Timeout | undefined;
  #interval: number;
  #flushStates = new WeakMap<ScopeBuffer, FlushState>();

  /** Takes an entry the logger recorded in `buffer`: delivers it if it is at or above `minLevel`, with the trail before an error. */
  public accept(recorded: RecordedEntry, buffer: ScopeBuffer): void {
    const { flushLevel = LogLevels.error } = this.#settings;
    const { level } = recorded;
    const minLevel = this.#resolveMinLevel(recorded);
    if (level < minLevel) return;
    if (level >= flushLevel) this.#flushTrail({ error: recorded, buffer, minLevel });
    this.addEntry(resolveEntry(recorded));
  }

  public addEntry(entry: LoggerEntry): void {
    this.#entries.push(entry);
    this.#checkNeedToSend();
  }

  #resolveMinLevel({ level, names, scopeId }: RecordedEntry): number {
    const { minLevel = 0 } = this.#settings;
    if (typeof minLevel === 'number') return minLevel;
    try {
      return minLevel({ level, names, ...(scopeId != null ? { scopeId } : {}) });
    } catch {
      // A broken level function must not cost the entry: deliver everything rather than nothing.
      return 0;
    }
  }

  /** Delivers, oldest first, what the scope logged below `minLevel` (the level decided for the error) since its last flush. */
  #flushTrail({ error, buffer, minLevel }: FlushTrailRequest): void {
    const { flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS } = this.#settings;
    if (minLevel <= 0) return;
    const state = this.#flushStates.get(buffer) ?? { lastSeq: 0, lastAt: Number.NEGATIVE_INFINITY };
    const now = Date.now();
    if (now - state.lastAt < flushIntervalMs) return;
    const trail = buffer.entries().filter(({ seq, level }) => seq > state.lastSeq && seq < error.seq && level < minLevel);
    if (trail.length === 0) return;
    this.#flushStates.set(buffer, { lastSeq: error.seq, lastAt: now });
    trail.forEach(recorded => this.addEntry({ ...resolveEntry(recorded), preceding: true }));
  }

  #checkNeedToSend(): void {
    const maxEntries = this.#settings?.maxEntries ?? 0;
    if (maxEntries > 0 && maxEntries <= this.#entries.length) return this.#send();
    if (this.#interval > 0 && (DateTime.now().valueOf() - this.#lastSendTimestamp) >= this.#interval) return this.#send();
    this.#startTimer();
  }

  #send(): void {
    this.#stopTimer();
    const entries = this.#entries;
    if (entries.length > 0) {
      this.#entries = [];
      this.#settings.onTrigger(entries);
    }
    this.#lastSendTimestamp = DateTime.now().valueOf();
    this.#startTimer();
  }

  #startTimer(): void {
    if (this.#interval <= 0) return;
    this.#stopTimer();
    this.#timerId = setTimeout(() => this.#send(), this.#interval);
  }

  #stopTimer(): void {
    clearTimeout(this.#timerId);
  }

}