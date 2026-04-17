import type { AnyFunction } from '../extensions';
import '../extensions/object';

const cache = new WeakMap<AnyFunction, Map<string, unknown>>();

interface MemoizeConfig {
  dependencies?: unknown[];
  maxCacheLength?: number;
}

export function memoize<T extends AnyFunction>(func: T, config?: MemoizeConfig): T {
  const { dependencies, maxCacheLength } = {
    dependencies: [] as unknown[],
    maxCacheLength: 0,
    ...config,
  };

  const funcCache: Map<string, unknown> = cache.get(func) ?? new Map();
  cache.set(func, funcCache);

  return ((...args: unknown[]) => {
    const key = Object.hash([...args, ...dependencies]);

    if (funcCache.has(key)) return funcCache.get(key);

    const result = func(...args);
    funcCache.set(key, result);

    if (maxCacheLength > 0) {
      while (funcCache.size > maxCacheLength) {
        funcCache.delete(funcCache.keys().next().value!);
      }
    }

    return result;
  }) as T;
}
