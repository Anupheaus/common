import { IMap, to } from '../extensions';

interface ISettingsFromOptions<T> {
  defaultValue?: T;
  isRequired?: boolean;
  transform?(value: string): T;
}

interface ISettingsFrom {
  env: {
    <T>(key: string): T;
    (key: string): string;
    <T>(key: string, options: ISettingsFromOptions<T>): T;
    mode: 'production' | 'development';
  };
}

function createSettingsFrom(): ISettingsFrom {
  const from = {
    env<T>(key: string, options?: ISettingsFromOptions<T>): T {
      const hasDefaultValue = options && Object.prototype.hasOwnProperty.call(options, 'defaultValue');
      const { defaultValue, isRequired, transform }: ISettingsFromOptions<T> = {
        defaultValue: undefined,
        isRequired: !hasDefaultValue,
        transform: value => {
          if (!hasDefaultValue) { return value; }
          const valueType = to.type(value);
          const defaultType = to.type(defaultValue);
          if (valueType === defaultType) { return value; }
          if (defaultType === 'array') { return value.split('|') as unknown as T; }
          if (defaultType === 'object') { return JSON.parse(value); }
          return to.type(defaultType, value);
        },
        ...options,
      };

      if (Object.prototype.hasOwnProperty.call(process.env, key)) { return transform(process.env[key]); }
      if (isRequired) { throw new Error(`The setting "${key}" was not found in the environment variables, but this is a required setting.`); }
      return defaultValue;
    },
  };

  Object.defineProperties(from.env, {
    mode: {
      get: () => from.env('NODE_ENV', {
        defaultValue: 'production',
        transform: value => ['dev', 'development'].includes((value || '').toLowerCase()) ? 'development' : 'production'
      }),
      enumerable: true,
      configurable: false,
    },
  });

  return from as ISettingsFrom;
}

export const createSettings = <TSettings extends IMap>(delegate: (from: ISettingsFrom) => TSettings): TSettings => delegate(createSettingsFrom());