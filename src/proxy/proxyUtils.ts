import { ProxyCache } from './privateModels';

export function pathFromArgs(args: unknown[], proxyCache: ProxyCache): PropertyKey[] {
  const proxy = args[0] instanceof Array ? undefined : args[0];
  const path = proxy != null ? proxyCache.get(proxy as unknown as object)?.path : args[0] instanceof Array ? args[0] : undefined;
  if (!(path instanceof Array)) throw new SyntaxError('The proxy or path provided for this function was invalid.');
  return path.slice();
}

export function pathsMatch(paths1: PropertyKey[], paths2: PropertyKey[], includeSubProperties: boolean): boolean {
  if (paths1.length === 0) return paths2.length === 0 || includeSubProperties;
  if (paths2.length < paths1.length) return false;
  if (paths1.length !== paths2.length && !includeSubProperties) return false;
  return paths1.every((path, index) => paths2[index] === path);
}

export function convertToCorrectPropertyType(propertyKey: PropertyKey): PropertyKey {
  if (typeof (propertyKey) !== 'string') return propertyKey;
  const keyAsNumber = parseFloat(propertyKey);
  if (keyAsNumber.toString() === propertyKey) return keyAsNumber;
  return propertyKey;
}
