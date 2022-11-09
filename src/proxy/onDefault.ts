import { CommonProps } from './privateModels';
import { OnDefaultCallback, OnDefaultEvent } from './publicModels';
import { TraverseProps } from './traverse';
import { pathFromArgs, pathsMatch } from './proxyUtils';
import { Unsubscribe } from '../events';

export interface OnDefaultProps {
  includeSubProperties?: boolean;
}

interface Props extends Omit<CommonProps, 'api'> { }

export function createOnDefault({ proxyCache }: Props) {
  const onDefaultCallbacks = new Set<OnDefaultCallback>();

  const raiseOnDefault: TraverseProps['onEmptyProperty'] = (traversedPath, remainingPath) => {
    let value: unknown;
    let isSet = false;
    const event: OnDefaultEvent = {
      get traversedPath() { return traversedPath; },
      get remainingPath() { return remainingPath; },
      get value() { return value; },
      set value(newValue: unknown) { isSet = true; value = newValue; },
    };
    onDefaultCallbacks.forEach(callback => callback(event));
    return { value, isSet };
  };

  function onDefault<R>(proxy: R, callback: OnDefaultCallback<R>, props?: OnDefaultProps): Unsubscribe;
  function onDefault<R>(path: PropertyKey[], callback: OnDefaultCallback<R>, props?: OnDefaultProps): Unsubscribe;
  function onDefault(...args: unknown[]): Unsubscribe {
    if (args.length < 2) throw new SyntaxError('This onGet function requires at least 2 arguments.');
    const path = pathFromArgs(args, proxyCache);
    const providedCallback = (typeof (args[1]) === 'function' ? args[1] : undefined) as OnDefaultCallback | undefined;
    const { includeSubProperties = false } = (args[2] != null && typeof (args[2]) === 'object' ? args[2] : {}) as OnDefaultProps;
    if (providedCallback == null) throw new SyntaxError('The callback function for this onDefault function was invalid.');
    const callback: OnDefaultCallback = event => {
      if (!pathsMatch(path, event.traversedPath, includeSubProperties)) return;
      providedCallback(event);
    };
    onDefaultCallbacks.add(callback);
    return () => { onDefaultCallbacks.delete(callback); };
  }

  return {
    raiseOnDefault,
    onDefault,
  };
}
