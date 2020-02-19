import { is } from '../extensions';

export function chain<TFunc extends Function>(...funcs: TFunc[]): TFunc {
  return ((...args: unknown[]) => {
    if (funcs.length == 0) { return; }
    let result = undefined;
    funcs.filter(is.function).forEach((func, index) => {
      const localResult = func(...args);
      if (index === 0) result = localResult;
    });
    return result;
  }) as unknown as TFunc;
}