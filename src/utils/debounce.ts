import type { AnyFunction } from '../extensions';

export type Debounced<Func extends AnyFunction> = ((...args: Parameters<Func>) => Promise<void>) & {
  /** Drop a pending invocation: `func` will not run and the promise returned by the pending call resolves
   *  cleanly (matching a superseded call), so awaiters never hang. No-op when nothing is pending. */
  cancel(): void;
};

export function debounce<Func extends AnyFunction>(func: Func, timeout: number = 200): Debounced<Func> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pending: { resolve(): void; reject(err: unknown): void } | null = null;

  const debounced = function (...args: Parameters<Func>): Promise<void> {
    clearTimeout(timeoutId as NodeJS.Timeout);
    pending?.resolve();  // superseded call resolves cleanly

    return new Promise<void>((resolve, reject) => {
      pending = { resolve, reject };
      timeoutId = setTimeout(async () => {
        timeoutId = null;
        pending = null;
        try {
          await func(...args);
          resolve();
        } catch (err) {
          reject(err);
        }
      }, timeout);
    });
  } as Debounced<Func>;

  debounced.cancel = () => {
    clearTimeout(timeoutId as NodeJS.Timeout);
    timeoutId = null;
    pending?.resolve();  // pending call never runs, but resolves cleanly so awaiters don't hang
    pending = null;
  };

  return debounced;
}
