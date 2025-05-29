import { DateTime } from 'luxon';
import type { AnyObject } from '../extensions';

export interface LoggerEntry {
  timestamp: DateTime;
  level: number;
  names: string[];
  message: string;
  meta?: AnyObject;
}

export interface LoggerListenerSettings {
  sendInterval?: {
    minutes?: number;
    seconds?: number;
  };
  maxEntries?: number;
  onTrigger(entries: LoggerEntry[]): void;
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

  public addEntry(entry: LoggerEntry): void {
    this.#entries.push(entry);
    this.#checkNeedToSend();
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