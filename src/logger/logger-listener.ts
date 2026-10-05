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

export interface LoggerListenerSettings {
  sendInterval?: {
    minutes?: number;
    seconds?: number;
  };
  maxEntries?: number;
  /**
   * The lowest level delivered as it happens. Default 0: every entry. Entries below it are held in their scope's flight
   * recorder and delivered only as the trail of an error (see `flushLevel`).
   */
  minLevel?: number;
  /** An entry at or above this level flushes the scope's undelivered lower-level entries first. Default error. */
  flushLevel?: number;
  /** At most one flush per scope in this time (storm guard). Default 10,000. */
  flushIntervalMs?: number;
  onTrigger(entries: LoggerEntry[]): void;
}

const DEFAULT_FLUSH_INTERVAL_MS = 10_000;

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
    const { minLevel = 0, flushLevel = LogLevels.error } = this.#settings;
    const { level } = recorded;
    if (level < minLevel) return;
    if (level >= flushLevel) this.#flushTrail(recorded, buffer);
    this.addEntry(resolveEntry(recorded));
  }

  public addEntry(entry: LoggerEntry): void {
    this.#entries.push(entry);
    this.#checkNeedToSend();
  }

  /** Delivers, oldest first, what the scope logged below `minLevel` since its last flush. */
  #flushTrail(error: RecordedEntry, buffer: ScopeBuffer): void {
    const { minLevel = 0, flushIntervalMs = DEFAULT_FLUSH_INTERVAL_MS } = this.#settings;
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