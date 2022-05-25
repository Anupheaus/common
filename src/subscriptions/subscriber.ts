import { AnyFunction } from '../extensions';

export function createSubscriber<TFunc extends AnyFunction>() {
  const callbacks = new Set<TFunc>();

  const subscribe = (callback: TFunc): () => void => {
    callbacks.add(callback);
    return () => {
      callbacks.delete(callback);
    };
  };

  const invoke = (...args: Parameters<TFunc>): ReturnType<TFunc>[] => {
    const results: ReturnType<TFunc>[] = [];
    callbacks.forEach(callback => {
      if (!callbacks.has(callback)) return;
      results.push(callback(...args));
    });
    return results;
  };

  return {
    subscribe,
    invoke,
  };
}