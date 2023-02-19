import { BaseLogger, ILogObj, ISettingsParam } from 'tslog';
import { is } from '../extensions';

export class Logger<T extends ILogObj = ILogObj> extends BaseLogger<T> {
  constructor(name: string, settings?: Omit<ISettingsParam<T>, 'name'>, logObj?: T) {
    super({
      ...settings,
      name,
      minLevel: 5
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
      }
    }
    if (process && process.env) {
      const level = parseLevel(process.env[`LOGGING_${name.toUpperCase()}`]);
      if (level) return level;
    }
    return 5;
  }
}
