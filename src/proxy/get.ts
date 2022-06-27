import { CommonProps } from './privateModels';
import { OnGetCallback, OnGetEvent } from './publicModels';
import { pathFromArgs, pathsMatch } from './proxyUtils';
import { Unsubscribe } from '../events';

interface OnGetProps {
  includeSubProperties?: boolean;
}

interface Props extends CommonProps { }

export function createGet({ proxyCache, api }: Props) {
  const callbacks = new Set<OnGetCallback>();

  function callOnGetCallbacks(value: unknown, path: PropertyKey[]): unknown {
    const event: OnGetEvent = { value, get path() { return path; } };
    callbacks.forEach(callback => callback(event));
    return event.value;
  }

  function onGet<R>(proxy: R, callback: OnGetCallback<R>, props?: OnGetProps): Unsubscribe;
  function onGet<R>(path: PropertyKey[], callback: OnGetCallback<R>, props?: OnGetProps): Unsubscribe;
  function onGet(...args: unknown[]): Unsubscribe {
    if (args.length < 2) throw new SyntaxError('This onGet function requires at least 2 arguments.');
    const path = pathFromArgs(args, proxyCache);
    const providedCallback = (typeof (args[1]) === 'function' ? args[1] : undefined) as OnGetCallback | undefined;
    const { includeSubProperties = false } = (args[2] != null && typeof (args[2]) === 'object' ? args[2] : {}) as OnGetProps;
    if (providedCallback == null) throw new SyntaxError('The callback function for this onGet function was invalid.');
    const callback: OnGetCallback = event => {
      if (!pathsMatch(path, event.path, includeSubProperties)) return;
      providedCallback(event);
    };
    callbacks.add(callback);
    return () => { callbacks.delete(callback); };
  }


  function get<R>(proxy: R): R | undefined;
  function get<R>(path: PropertyKey[]): R | undefined;
  function get(...args: unknown[]) {
    const path = pathFromArgs(args, proxyCache);
    return callOnGetCallbacks(api.get(path).value, path);
  }

  return {
    get,
    onGet,
  };
}