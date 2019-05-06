import { IMap } from '../extensions';

interface IFrom<E extends IMap = IMap, P extends IMap = IMap> {
  env: {
    mode: string;
    <K extends keyof E>(name: K): E[K];
    <K extends keyof E, V>(name: K, format: (value: E[K]) => V): V;
    <K extends keyof E>(name: K, defaultValue: E[K]): E[K];
    <K extends keyof E, V>(name: K, format: (value: E[K]) => V, defaultValue: V): V;
  };
  packageJson: {
    title: string;
    version: string;
    <K extends keyof P>(name: K): P[K];
    <K extends keyof P, V>(name: K, format: (value: P[K]) => V): V;
    <K extends keyof P>(name: K, defaultValue: P[K]): P[K];
    <K extends keyof P, V>(name: K, format: (value: P[K]) => V, defaultValue: V): V;
  };
}

function loadJsonFile(file: string, maxSearchDepthForJSONFiles: number, errorOnFSFail: boolean = false) {
  let fs: typeof import('fs');
  try {
    fs = require('fs');
  } catch (error) {
    if (errorOnFSFail) { throw new Error('Trying to use fs in a client environment.'); }
  }
  let maxCount = maxSearchDepthForJSONFiles;
  let foundFile = false;
  while (!(foundFile = fs.existsSync(file)) && maxCount > 0) { file = `../${file}`; maxCount--; }
  return foundFile ? JSON.parse(fs.readFileSync(file).toString()) : undefined;
}

function loadPackageJson(config: IConfig): IMap {
  const packageJsonContents = loadJsonFile('package.json', config.maxSearchDepthForJSONFiles, true);
  if (!packageJsonContents) { throw new Error('Unable to find the package.json file for this project.'); }
  return packageJsonContents;
}

function loadAnyEnvironmentVariables(config: IConfig) {
  const envs = loadJsonFile('envs.json', config.maxSearchDepthForJSONFiles);
  if (!envs) { return; }
  // tslint:disable-next-line: forin
  for (const key in envs) { process.env[key] = envs[key]; }
}

function getValueUsingName(args: any[], getValueUsingNameDelegate: (name: string) => any): any {
  const name = args[0];
  const format = typeof (args[1]) === 'function' ? args[1] : (v: any) => v;
  const defaultValue = args.length > 2 ? args[2] : args[1] != null && typeof (args[1]) !== 'function' ? args[1] : undefined;
  const value = getValueUsingNameDelegate(name);
  return value != null ? format(value) : defaultValue;
}

function createEnvFunc(): IFrom['env'] {
  const env: IFrom['env'] = <V>(...args: any[]): V => getValueUsingName(args, name => process.env[name]);
  env.mode = (process.env['mode'] || '').toLowerCase() === 'production' ? 'production' : 'development';
  return env;
}

function createPackageJsonFunc(config: IConfig): IFrom['packageJson'] {
  let packageJsonContents: IMap;
  const packageJson: IFrom['packageJson'] = (<V>(...args: any[]): V => {
    packageJsonContents = packageJsonContents || loadPackageJson(config);
    return getValueUsingName(args, name => packageJson[name]);
  }) as any;
  Object.defineProperties(packageJson, {
    title: {
      get: () => packageJson('name'),
      enumerable: true,
      configurable: true,
    },
    version: {
      get: () => packageJson('version'),
      enumerable: true,
      configurable: true,
    },
  });
  return packageJson;
}

interface IConfig<E extends IMap = IMap, P extends IMap = IMap> {
  maxSearchDepthForJSONFiles?: number;
  environmentVariableKeys: E;
  packageJsonKeys: P;
}

export function createSettings<T extends IMap, E extends IMap, P extends IMap>(config: IConfig<E, P>, delegate: (from: IFrom<E, P>) => T): T {
  config = {
    maxSearchDepthForJSONFiles: 15,
    ...config,
  };
  loadAnyEnvironmentVariables(config);
  return delegate({
    env: createEnvFunc(),
    packageJson: createPackageJsonFunc(config),
  });
}
