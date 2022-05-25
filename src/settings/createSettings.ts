import { AnyObject, StandardDataTypes, to } from '../extensions';

interface SettingsFromOptions<T> {
  defaultValue?: T;
  isRequired?: boolean;
  transform?(value: string): T;
}

interface SettingsFrom {
  env(key: string): string;
  env<T>(key: string): T;
  env(key: string): string;
  env(key: string, options: SettingsFromOptions<string>): string;
  env<T>(key: string, options: SettingsFromOptions<T>): T;
  preset: {
    readonly mode: 'production' | 'development';
  };
}

function createSettingsFrom(): SettingsFrom {
  const from: SettingsFrom = {
    env<T>(key: string, options?: SettingsFromOptions<T>): T {
      const hasDefaultValue = options && 'defaultValue' in options;
      const settings: SettingsFromOptions<T> = {
        defaultValue: undefined,
        isRequired: !hasDefaultValue,
        transform: value => {
          if (!hasDefaultValue) { return value; }
          const valueType = to.type(value);
          const defaultType: StandardDataTypes = to.type(settings.defaultValue);
          if (valueType === defaultType) { return value; }
          if (defaultType === 'array') { return value.split('|') as unknown as T; }
          if (defaultType === 'object') { return JSON.parse(value); }
          return to.type(defaultType, value);
        },
        ...options,
      };

      const { defaultValue, isRequired, transform } = settings;
      if (typeof (process) === 'undefined') throw new Error('The settings should not be used outside of a node environment.');
      if (key in process.env && transform) { return transform(process.env[key] ?? ''); }
      if (isRequired) { throw new Error(`The setting "${key}" was not found in the environment variables, but this is a required setting.`); }
      return defaultValue as T;
    },
    preset: {
      get mode() {
        return from.env('NODE_ENV', {
          defaultValue: 'production',
          isRequired: true,
          transform: value => ['dev', 'development'].includes((value || '').toLowerCase()) ? 'development' : 'production'
        }) as SettingsFrom['preset']['mode'];
      },
    },
  };

  return from;
}

export const createSettings = <TSettings extends AnyObject>(delegate: (from: SettingsFrom) => TSettings): TSettings => delegate(createSettingsFrom());
