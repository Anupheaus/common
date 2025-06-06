/* eslint-disable no-console */
import { DateTime } from 'luxon';
import { is } from '../extensions/is';
import { Error as CommonError } from '../errors';
import type { AnyObject } from '../extensions/global';
import '../extensions/array';
import type { Unsubscribe } from '../events';
import { to } from '../extensions';
import type { LoggerEntry, LoggerListenerSettings } from './logger-listener';
import { LoggerListener } from './logger-listener';
import { LoggerServices } from './logger-services';

const defaultMinLevel = 5;
let asyncLocalStorage: { getStore(): Logger | undefined; run<T>(logger: Logger, delegate: () => T): T; } | undefined;

interface LevelSettings {
  name: string;
  consoleMethod: 'log' | 'warn' | 'error' | 'info';
  levelColors: { node: string; browserTextColor?: string; browserBackgroundColor?: string; };
}

const levelSettings: LevelSettings[] = [
  { name: 'silly', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[37m', browserTextColor: '#999' } },
  { name: 'trace', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[36m', browserTextColor: '#1c6679' } },
  { name: 'debug', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[32m', browserTextColor: '#216742' } },
  { name: 'info', consoleMethod: 'info', levelColors: { node: '\x1b[2m\x1b[30m\x1b[42m', browserTextColor: '#000', browserBackgroundColor: '#227959' } },
  { name: 'warn', consoleMethod: 'warn', levelColors: { node: '\x1b[2m\x1b[30m\x1b[43m', browserTextColor: '#000', browserBackgroundColor: '#8e8e25' } },
  { name: 'error', consoleMethod: 'error', levelColors: { node: '\x1b[2m\x1b[41m\x1b[37m', browserTextColor: '#fff', browserBackgroundColor: '#823435' } },
  { name: 'fatal', consoleMethod: 'error', levelColors: { node: '\x1b[1m\x1b[41m\x1b[37m', browserTextColor: '#fff', browserBackgroundColor: '#823435' } },
];

interface LoggerSettings {
  minLevel?: number;
  includeTimestamp?: boolean;
  globalMeta?: AnyObject | undefined;
  filename?: string;
  useColors?: boolean;
}

export const LogLevels = {
  'silly': 0,
  'trace': 1,
  'debug': 2,
  'info': 3,
  'warn': 4,
  'error': 5,
  'fatal': 6,
} as const;

const logLevelNumberToString = Object.entries(LogLevels).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {} as Record<number, string>);

const alwaysLog: number[] = (['error', 'fatal', 'warn'] as (keyof typeof LogLevels)[]).map(level => LogLevels[level]);

interface InternalLoggerSettings extends Omit<Required<LoggerSettings>, 'globalMeta' | 'filename'> {
  globalMeta: AnyObject | undefined;
  filename: string | undefined;
}

const registeredListeners = new Set<LoggerListener>();
function sendToListeners(entry: LoggerEntry): void {
  registeredListeners.forEach(listener => listener.addEntry(entry));
}

export class Logger {
  constructor(name: string, settings?: LoggerSettings) {
    this.#name = name;
    this.#settings = settings;
    this.#hasStatedLevelInNode = false;
    this.#callbacks = new Set();
  }

  public static registerListener(settings: LoggerListenerSettings): Unsubscribe {
    const listener = new LoggerListener(settings);
    registeredListeners.add(listener);
    return () => { registeredListeners.delete(listener); };
  }

  public static get services(): typeof LoggerServices {
    return LoggerServices;
  }

  public static getCurrent(): Logger | undefined {
    if (is.browser()) throw new Error('This should not be used in the browser.');
    if (asyncLocalStorage == null) return undefined;
    return asyncLocalStorage.getStore();
  }

  public static getLevelAsString(level: number): string {
    return logLevelNumberToString[level] ?? 'silly';
  }

  protected parent: Logger | undefined;

  #callbacks: Set<(details: LoggerEntry) => void>;
  #name: string;
  #settings?: LoggerSettings;
  #hasStatedLevelInNode: boolean;


  public silly(message: string, meta?: AnyObject): void {
    this.report(0, message, meta);
  }

  public trace(message: string, meta?: AnyObject): void {
    this.report(1, message, meta);
  }

  public debug(message: string, meta?: AnyObject): void {
    this.report(2, message, meta);
  }

  public info(message: string, meta?: AnyObject): void {
    this.report(3, message, meta);
  }

  public warn(message: string, meta?: AnyObject): void {
    this.report(4, message, meta);
  }

  public error(message: string, meta?: AnyObject): void;
  public error(error: Error, meta?: AnyObject): void;
  public error(messageOrError: string | Error, meta?: AnyObject): void {
    this.report(5, ...this.parseError(messageOrError, meta));
  }

  public fatal(message: string, meta?: AnyObject): void;
  public fatal(error: Error, meta?: AnyObject): void;
  public fatal(messageOrError: string | Error, meta?: AnyObject): void {
    this.report(6, ...this.parseError(messageOrError, meta));
  }

  public wrap<T>(level: keyof typeof LogLevels, message: string, delegate: () => T): T {
    this.report(LogLevels[level], `${message} started...`);
    const startTime = Date.now();
    try {
      const result = delegate();
      if (result instanceof Promise) {
        return result.then(innerResult => {
          this.report(LogLevels[level], `${message} completed (${Date.now() - startTime}ms).`);
          return innerResult;
        }).catch(error => {
          this.report(LogLevels[level], `${message} failed (${Date.now() - startTime}ms).`, { error });
          throw error;
        }) as unknown as T;
      } else {
        this.report(LogLevels[level], `${message} completed (${Date.now() - startTime}ms).`);
        return result;
      }
    } catch (error) {
      this.report(LogLevels[level], `${message} failed (${Date.now() - startTime}ms).`, { error });
      throw error;
    }
  }

  public onLog(delegate: (details: LoggerEntry) => void): () => void {
    this.#callbacks.add(delegate);
    return () => { this.#callbacks.delete(delegate); };
  }

  public createSubLogger(name: string, settings?: LoggerSettings): Logger {
    const subLogger = new Logger(name, settings);
    subLogger.parent = this;
    return subLogger;
  }

  public async provide<T>(delegate: () => T): Promise<T> {
    if (is.browser()) throw new Error('This should not be used in the browser.');

    if (asyncLocalStorage == null) {
      const { AsyncLocalStorage } = require('async_hooks');
      asyncLocalStorage = new AsyncLocalStorage();
    }
    return (asyncLocalStorage as AnyObject).run(this, delegate);
  }

  protected get name() { return this.#name; }

  protected get allNames() {
    const parentNames = [];
    let parent = this as Logger | undefined;
    while (parent) { parentNames.push(parent.name); parent = parent.parent; }
    return parentNames.reverse();
  }

  protected get settings(): InternalLoggerSettings {
    const parentSettings = this.parent?.settings;
    const globalMeta = { ...parentSettings?.globalMeta, ...this.#settings?.globalMeta };
    return {
      includeTimestamp: parentSettings?.includeTimestamp ?? is.node(),
      useColors: parentSettings?.useColors ?? this.getUseColors(),
      ...this.#settings,
      minLevel: this.getMinLevel(),
      filename: this.getFileName(),
      globalMeta: Object.keys(globalMeta).length === 0 ? undefined : globalMeta,
    };
  }

  protected report(level: number, message: string, meta?: AnyObject, ignoreLevel = false): void {
    const settings = this.settings;
    const shouldLogToConsole = alwaysLog.includes(level);
    if (!ignoreLevel && level < settings.minLevel && !shouldLogToConsole) return;
    const timestamp = DateTime.local();
    const lvlSettings = levelSettings[level];
    const parentNames = this.allNames;
    if (settings.globalMeta) meta = { ...settings.globalMeta, ...meta };
    if (is.node()) {
      const useColors = this.settings.useColors;
      const fullMessage = `${this.#createNodeMessage(timestamp, lvlSettings, parentNames, message, useColors)}${meta == null ? '' : '\n'}`;
      if (is.blank(settings.filename) || shouldLogToConsole) {
        console[lvlSettings.consoleMethod](fullMessage, ...[this.#sanitiseMeta(meta)].removeNull());
      }
      if (is.not.blank(settings.filename)) {
        const { writeToFile } = require('./nodeUtils');
        writeToFile(settings.filename, this.#createNodeMessage(timestamp, lvlSettings, parentNames, message, false), meta);
      }
    } else {
      const parts: string[] = [];
      const css: string[] = [];
      if (settings.includeTimestamp) { parts.push(`%c[${timestamp.toFormat('dd/MM/yyyy HH:mm:ss:SSS')}]`); css.push('color:#999;'); }
      parts.push(`%c[${lvlSettings.name.toUpperCase().padEnd(5)}]`);
      css.push(`color:${lvlSettings.levelColors.browserTextColor ?? '#fff'};background-color:${lvlSettings.levelColors.browserBackgroundColor ?? 'transparent'};`);
      parts.push(`%c[${parentNames.join(' > ')}]`); css.push('color:#fff;');
      parts.push(`%c${message}`); css.push('color:#f5d42d;');
      const allCss = css.map(part => [part, 'color:unset;background-color:unset;']).flatten();
      allCss.pop();
      console.log(`${parts.join('%c ')}\n`, ...allCss, ...[meta].removeNull());
    }
    this.#invokeCallbacks({ timestamp, names: parentNames, level, message, meta });
  }

  protected parseErrorStack(stack: string | undefined): string[] {
    if (stack == null) return [];
    return stack.split('\n')
      .map(line => line.trim())
      .filter(is.not.blank)
      .filter(line => line.startsWith('at '));
  }

  protected parseError(messageOrError: string | Error, meta?: AnyObject): [string, AnyObject?] {
    let message = '';
    if (messageOrError instanceof Error) {
      message = is.string(messageOrError) ? messageOrError : `${messageOrError.name}: ${messageOrError.message}`;
      const error = messageOrError;
      meta = {
        ...meta,
        ...(error instanceof CommonError ? error : {}),
        stack: this.parseErrorStack(error.stack)
      };
    } else {
      message = messageOrError;
    }
    return [message, meta];
  }

  protected getMinLevel(): number {
    if (this.parent?.settings.minLevel != null) return this.parent.settings.minLevel;
    if (this.#settings?.minLevel != null) return this.#settings.minLevel;
    let name = this.allNames.join('_').replace(/-/g, '_').replace(/\s/g, '_');
    const parseLevel = (value: string | null | undefined): number | undefined => {
      if (value == null) return undefined;
      const level = parseInt(value);
      if (!isNaN(level)) return Math.between(level, 0, 6);
    };
    if (is.browser()) {
      name = `Logging.${name.replace(/_/g, '.')}`;
      const localStorage = window.localStorage;
      if (localStorage) {
        const level = parseLevel(localStorage.getItem(name));
        if (level != null) return level;
        localStorage.setItem(name, defaultMinLevel.toString());
      }
    }
    if (is.node() && process && process.env) {
      name = `LOGGING_${name.toUpperCase()}`;
      const level = parseLevel(process.env[name]);
      if (!this.#hasStatedLevelInNode) {
        this.#hasStatedLevelInNode = true;
        if (level == null) this.report(3, `No level set for logger '${this.#name}' in environment variable '${name}'. Defaulting to ${defaultMinLevel}.`, undefined, true);
      }
      if (level != null) return level;
    }
    return defaultMinLevel;
  }

  protected getUseColors(): boolean {
    if (is.node() && process && process.env) {
      let name = this.allNames.join('_').replace(/-/g, '_').replace(/\s/g, '_');
      name = `LOGGING_${name.toUpperCase()}_USE_COLORS`;
      return to.number(process.env[name], 1) !== 0;
    }
    return true;
  }

  protected getFileName(): string | undefined {
    if (!is.node()) return undefined;
    if (this.#settings?.filename != null) return this.#settings.filename;
    if (this.parent?.settings.filename != null) return this.parent.settings.filename;

    let name = this.allNames.join('_').replace(/-/g, '_').replace(/\s/g, '_');
    const parseFilename = (value: string | null | undefined): string | undefined => {
      if (is.blank(value)) return undefined;
      return value.replace(/\\/g, '/');
    };
    if (process && process.env) {
      name = `LOGGING_${name.toUpperCase()}_FILENAME`;
      const filename = parseFilename(process.env[name]);
      if (is.not.blank(filename)) return filename;
    }
  }

  #invokeCallbacks(details: LoggerEntry): void {
    sendToListeners(details);
    this.#callbacks.forEach(callback => {
      try {
        callback(details);
      } catch (error) {
        this.#callbacks.delete(callback);
        this.report(5, 'Error in onLog callback, callback has been removed.', { error });
      }
    });
  }

  #createNodeMessage(timestamp: DateTime, lvlSettings: LevelSettings, parentNames: string[], message: string, withColours = true): string {
    const parts: string[] = withColours ? ['\x1b[0m'] : [];
    if (this.settings.includeTimestamp) parts.push(`${withColours ? '\x1b[37m\x1b[2m' : ''}[${timestamp.toFormat('dd/MM/yyyy HH:mm:ss:SSS')}]`);
    parts.push(`${withColours ? lvlSettings.levelColors.node : ''}[${lvlSettings.name.toUpperCase().padEnd(5)}]`);
    parts.push(`${withColours ? '\x1b[37m' : ''}[${parentNames.join(' > ')}]`);
    parts.push(`${withColours ? '\x1b[1m\x1b[33m' : ''}${message}`);
    return `${withColours ? '\x1b[0m' : ''}${parts.join(withColours ? '\x1b[0m ' : ' ')}${withColours ? '\x1b[0m' : ''}`;
  }

  #sanitiseMeta(meta?: AnyObject | undefined) {
    if (meta == null) return;
    const util = require('util');
    const parseMeta = (target: AnyObject | undefined): void => {
      if (target == null) return;
      Reflect.walk(target, ({ get, set }) => {
        const value = get();
        if (value instanceof CommonError) {
          const errorJson = value.toJSON() as AnyObject;
          delete errorJson['@error'];
          delete errorJson.hasBeenHandled;
          parseMeta(errorJson.meta);
          set(errorJson);
        }
      });
    };
    parseMeta(meta);
    return util.inspect(meta, { depth: null, colors: true });
  }
}

export function useLogger(): Logger {
  const logger = Logger.getCurrent();
  if (logger == null) throw new Error('No logger found in context');
  return logger;
}
