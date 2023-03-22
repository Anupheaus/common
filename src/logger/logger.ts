/* eslint-disable no-console */
import { DateTime } from 'luxon';
import { is } from '../extensions/is';
import { Error as CommonError } from '../errors';
import type { AnyObject } from '../extensions/global';
import '../extensions/array';

const defaultMinLevel = 5;

interface LevelSettings {
  name: string;
  consoleMethod: 'log' | 'warn' | 'error';
  levelColors: { node: string; browserTextColor?: string; browserBackgroundColor?: string; };
}

const levelSettings: LevelSettings[] = [
  { name: 'silly', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[37m', browserTextColor: '#999' } },
  { name: 'trace', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[36m', browserTextColor: '#1c6679' } },
  { name: 'debug', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[32m', browserTextColor: '#216742' } },
  { name: 'info', consoleMethod: 'log', levelColors: { node: '\x1b[2m\x1b[30m\x1b[42m', browserTextColor: '#000', browserBackgroundColor: '#227959' } },
  { name: 'warn', consoleMethod: 'warn', levelColors: { node: '\x1b[2m\x1b[30m\x1b[43m', browserTextColor: '#000', browserBackgroundColor: '#8e8e25' } },
  { name: 'error', consoleMethod: 'error', levelColors: { node: '\x1b[2m\x1b[41m\x1b[37m', browserTextColor: '#fff', browserBackgroundColor: '#823435' } },
  { name: 'fatal', consoleMethod: 'error', levelColors: { node: '\x1b[1m\x1b[41m\x1b[37m', browserTextColor: '#fff', browserBackgroundColor: '#823435' } },
];

interface LoggerSettings {
  minLevel?: number;
  includeTimestamp?: boolean;
  persistentMeta?: AnyObject | undefined;
}

interface InternalLoggerSettings extends Required<Omit<LoggerSettings, 'persistentMeta'>> {
  persistentMeta: AnyObject | undefined;
}

export class Logger {
  constructor(name: string, settings?: LoggerSettings) {
    this.#name = name;
    this.#settings = settings;
    this.#hasStatedLevelInNode = false;
  }

  protected parent: Logger | undefined;

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

  public createSubLogger(name: string, settings?: LoggerSettings): Logger {
    const subLogger = new Logger(name, settings);
    subLogger.parent = this;
    return subLogger;
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
    const persistentMeta = { ...parentSettings?.persistentMeta, ...this.#settings?.persistentMeta };
    return {
      includeTimestamp: parentSettings?.includeTimestamp ?? is.node(),
      ...this.#settings,
      minLevel: this.getMinLevel(),
      persistentMeta: Object.keys(persistentMeta).length === 0 ? undefined : persistentMeta
    };
  }

  protected async report(level: number, message: string, meta?: AnyObject, ignoreLevel = false): Promise<void> {
    if (!ignoreLevel && level < this.settings.minLevel) return;
    const timestamp = DateTime.local();
    const lvlSettings = levelSettings[level];
    const parentNames = this.allNames;
    if (this.settings.persistentMeta) meta = { ...this.settings.persistentMeta, ...meta };
    if (is.node()) {
      // const { writeToFile } = require('./nodeUtils');
      const parts: string[] = ['\x1b[0m'];
      if (this.settings.includeTimestamp) parts.push(`\x1b[37m\x1b[2m[${timestamp.toFormat('dd/MM/yyyy HH:mm:ss:SSS')}]`);
      parts.push(`${lvlSettings.levelColors.node}[${lvlSettings.name.toUpperCase().padEnd(5)}]`);
      parts.push(`\x1b[37m[${parentNames.join(' > ')}]`);
      parts.push(`\x1b[1m\x1b[33m${message}`);
      const fullMessage = `\x1b[0m${parts.join('\x1b[0m ')}\x1b[0m${meta == null ? '' : '\n'}`;
      console[lvlSettings.consoleMethod](fullMessage, ...[meta].removeNull());
      // writeToFile(fullMessage, meta);
    } else {
      const parts: string[] = [];
      const css: string[] = [];
      if (this.settings.includeTimestamp) { parts.push(`%c[${timestamp.toFormat('dd/MM/yyyy HH:mm:ss:SSS')}]`); css.push('color:#999;'); }
      parts.push(`%c[${lvlSettings.name.toUpperCase().padEnd(5)}]`);
      css.push(`color:${lvlSettings.levelColors.browserTextColor ?? '#fff'};background-color:${lvlSettings.levelColors.browserBackgroundColor ?? 'transparent'};`);
      parts.push(`%c[${parentNames.join(' > ')}]`); css.push('color:#fff;');
      parts.push(`%c${message}`); css.push('color:#f5d42d;');
      const allCss = css.map(part => [part, 'color:unset;background-color:unset;']).flatten();
      allCss.pop();
      console.log(`${parts.join('%c ')}\n`, ...allCss, ...[meta].removeNull());
    }
  }

  protected parseErrorStack(stack: string | undefined): string[] {
    if (stack == null) return [];
    return stack.split('\n')
      .map(line => line.trim())
      .filter(is.not.empty)
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
}
