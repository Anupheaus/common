import type { AnyFunction } from '../extensions';
import '../extensions/reflect';

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
  const { dependencies, maxCacheLength } = {
    dependencies: [],
    maxCacheLength: 0,
    ...config,
  };

  const funcCache: Cache[] = (cache.has(func) ? cache.get(func) : undefined) ?? [];
  cache.set(func, funcCache);

  return ((...args: unknown[]) => {
    const innerDependencies = [...args, ...dependencies];

    let cacheItem = funcCache.find(item => Reflect.areShallowEqual(item.dependencies, innerDependencies));
    if (cacheItem) { return cacheItem.result; }

    const result = func(...args);

    cacheItem = { dependencies: innerDependencies, result };
    funcCache.push(cacheItem);

    if (maxCacheLength > 0) { while (funcCache.length > maxCacheLength) { funcCache.shift(); } }

    return result;
  }) as T;

}
