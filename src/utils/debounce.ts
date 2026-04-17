import type { AnyFunction } from '../extensions';

export type Debounced<Func extends AnyFunction> = (...args: Parameters<Func>) => Promise<void>;

export function debounce<Func extends AnyFunction>(func: Func, timeout: number = 200): Debounced<Func> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pending: { resolve(): void; reject(err: unknown): void } | null = null;

  return function (...args: Parameters<Func>): Promise<void> {
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
  };
}
