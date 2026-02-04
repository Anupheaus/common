import type { AnyFunction } from '../extensions';

export type Debounced<Func extends AnyFunction> = (...args: Parameters<Func>) => Promise<void>;

export function debounce<Func extends AnyFunction>(func: Func, timeout: number = 200): Debounced<Func> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return async function (...args: Parameters<Func>) {
    clearTimeout(timeoutId as NodeJS.Timeout);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func(...args);
    }, timeout);
  };
}
