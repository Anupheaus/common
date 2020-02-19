import { AnyFunction } from '../extensions';

interface Cache {
  dependencies: unknown[];
  result: unknown;
}

const cache = new WeakMap<AnyFunction, Cache[]>();

interface MemoizeConfig {
  dependencies?: unknown[];
  maxCacheLength?: number;
}

export function memoize<T extends AnyFunction>(func: T, config?: MemoizeConfig): T {
  config = {
    dependencies: [],
    maxCacheLength: 0,
    ...config,
  };

  const funcCache: Cache[] = cache.has(func) ? cache.get(func) : [];

  return ((...args: unknown[]) => {
    const dependencies = [...args, ...config.dependencies];

    let cacheItem = funcCache.find(item => Reflect.areShallowEqual(item.dependencies, dependencies));
    if (cacheItem) { return cacheItem.result; }

    const result = func(...args);

    cacheItem = { dependencies, result };
    funcCache.push(cacheItem);

    if (config.maxCacheLength > 0) { while (funcCache.length > config.maxCacheLength) { funcCache.shift(); } }

    return result;
  }) as T;

}
