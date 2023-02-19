import { BaseLogger, ILogObj, ISettingsParam } from 'tslog';
import { Error as CommonError } from '../errors';
import { AnyObject, is } from '../extensions';

const defaultMinLevel = 5;

export class Logger<T extends ILogObj = ILogObj> extends BaseLogger<T> {
  constructor(name: string, settings?: Omit<ISettingsParam<T>, 'name'>, logObj?: T) {
    super({
      ...settings,
      name,
      minLevel: defaultMinLevel,
    }, logObj, 5);
    this.settings.minLevel = this.#getMinLevelFor(name);
  }

  #getMinLevelFor(name: string): number {
    name = name.replaceAll('-', '_').replaceAll(' ', '_');
    const parseLevel = (value: string | null | undefined): number | undefined => {
      if (value == null) return undefined;
      const level = parseInt(value);
      if (!isNaN(level)) return Math.between(level, 0, 6);
    };

    if (is.browser()) {
      const localStorage = window.localStorage;
      if (localStorage) {
        const level = parseLevel(localStorage.getItem(`logging_${name}`));
        if (level) return level;
        localStorage.setItem(`logging_${name}`, defaultMinLevel.toString());
      }
    }
    if (process && process.env) {
      const level = parseLevel(process.env[`LOGGING_${name.toUpperCase()}`]);
      if (level) return level;
    }
    return defaultMinLevel;
  }

  public silly(message: string, meta?: AnyObject): void {
    this.log(0, 'silly', message, meta);
  }

  public trace(message: string, meta?: AnyObject): void {
    this.log(1, 'trace', message, meta);
  }

  public debug(message: string, meta?: AnyObject): void {
    this.log(2, 'debug', message, meta);
  }

  public info(message: string, meta?: AnyObject): void {
    this.log(3, 'info', message, meta);
  }

  public warn(message: string, meta?: AnyObject): void {
    this.log(4, 'warn', message, meta);
  }

  public error(message: string, meta?: AnyObject): void;
  public error(error: Error, meta?: AnyObject): void;
  public error(messageOrError: string | Error, meta?: AnyObject): void {
    let message = '';
    if (messageOrError instanceof Error) {
      message = is.string(messageOrError) ? messageOrError : `${messageOrError.name}: ${messageOrError.message}`;
      const error = messageOrError;
      meta = {
        ...meta,
        ...(error instanceof CommonError ? error : {
          stack: error.stack,
        }),
      };
    } else {
      message = messageOrError;
    }
    this.log(5, 'error', message, meta);
  }

  public fatal(message: string, meta?: AnyObject): void;
  public fatal(error: Error, meta?: AnyObject): void;
  public fatal(messageOrError: string | Error, meta?: AnyObject): void {
    let message = '';
    if (messageOrError instanceof Error) {
      message = is.string(messageOrError) ? messageOrError : `${messageOrError.name}: ${messageOrError.message}`;
      const error = messageOrError;
      meta = {
        ...meta,
        ...(error instanceof CommonError ? error : {
          stack: error.stack,
        }),
      };
    } else {
      message = messageOrError;
    }
    this.log(6, 'fatal', message, meta);
  }
}
