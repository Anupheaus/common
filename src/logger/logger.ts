import { ILogObj, ISettingsParam, Logger as TSLogger } from 'tslog';
import { Error as CommonError } from '../errors';
import { AnyObject, is } from '../extensions';

const defaultMinLevel = 5;

export class Logger {
  constructor(name: string, settings?: Omit<ISettingsParam<ILogObj>, 'name'>);
  constructor(name: string, settings?: Omit<ISettingsParam<ILogObj>, 'name'>, log?: TSLogger<ILogObj>) {
    this.#log = log ? log : new TSLogger({
      ...settings,
      name,
      minLevel: this.#getMinLevelFor(name),
    });
  }

  #log: TSLogger<ILogObj>;

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
    this.#log.silly(message, meta);
  }

  public trace(message: string, meta?: AnyObject): void {
    this.#log.trace(message, meta);
  }

  public debug(message: string, meta?: AnyObject): void {
    this.#log.debug(message, meta);
  }

  public info(message: string, meta?: AnyObject): void {
    this.#log.info(message, meta);
  }

  public warn(message: string, meta?: AnyObject): void {
    this.#log.warn(message, meta);
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
    this.#log.error(message, meta);
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
    this.#log.fatal(message, meta);
  }

  public createSubLogger(name: string, settings?: Omit<ISettingsParam<ILogObj>, 'name'>): Logger {
    return new (Logger as any)(name, settings, this.#log.getSubLogger({ ...settings, name }));
  }
}
