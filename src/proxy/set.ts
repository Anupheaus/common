import type { CommonProps } from './privateModels';
import type { OnAfterSetCallback, OnAfterSetEvent, OnSetCallback, OnSetEvent } from './publicModels';
import { traverseObject } from './traverse';
import type { TraverseProps } from './traverse';
import { pathFromArgs, pathsMatch } from './proxyUtils';
import type { Unsubscribe } from '../events';

interface Props extends Omit<CommonProps, 'api'> {
  target: object;
  raiseOnDefault: Required<TraverseProps>['onEmptyProperty'];
}

export interface OnSetProps {
  includeSubProperties?: boolean;
}

export interface OnAfterSetProps {
  includeSubProperties?: boolean;
}

export function createSet<T extends object>({ proxyCache, target, raiseOnDefault }: Props) {
  const onSetCallbacks = new Set<OnSetCallback>();
  const onAfterSetCallbacks = new Set<OnAfterSetCallback>();

  function callOnSetCallbacks(newValue: unknown, oldValue: unknown, path: PropertyKey[]) {
    let isDefaultPrevented = false;
    const event: OnSetEvent = {
      get isDefaultPrevented() { return isDefaultPrevented; },
      newValue,
      get oldValue() { return oldValue; },
      get path() { return path; },
      preventDefault() { isDefaultPrevented = true; },
    };
    onSetCallbacks.forEach(callback => callback(event));
    return event;
  }

  function callOnAfterSetCallbacks(newValue: unknown, oldValue: unknown, path: PropertyKey[]): void {
    const event: OnAfterSetEvent = {
      get newValue() { return newValue; },
      get oldValue() { return oldValue; },
      get path() { return path; },
    };
    onAfterSetCallbacks.forEach(callback => callback(event));
  }

  function set(newValue: T): void;
  function set<R>(proxy: R, newValue: R): void;
  function set<R>(path: PropertyKey[], newValue: R): void;
  function set(...args: unknown[]): void {
    if (args.length === 1) args.unshift([]);
    if (args.length !== 2) throw new SyntaxError('This set function requires 2 arguments.');
    const path = pathFromArgs(args, proxyCache);
    const value = args[1];
    if (path.length === 0) {
      const { newValue, isDefaultPrevented } = callOnSetCallbacks(value, target, path);
      if (isDefaultPrevented) return;
      const oldValue = Object.clone(target);
      Object.assign(target, newValue);
      callOnAfterSetCallbacks(newValue, oldValue, []);
    } else {
      const fullPath = path.slice();
      const propertyKey = path.pop();
      if (propertyKey == null) return;
      const onEmptyProperty: TraverseProps['onEmptyProperty'] = (traversedPath, remainingPath) => {
        const result = raiseOnDefault(traversedPath, remainingPath);
        if (result.isSet) return result;
        if (remainingPath.length > 0 && typeof (remainingPath[0]) === 'number') return { value: [], isSet: true };
        return { value: {}, isSet: true };
      };
      const setTarget = traverseObject(target, path, { onEmptyProperty, set }).value as object;
      if (setTarget == null || typeof (setTarget) !== 'object') return;
      const oldValue = Reflect.get(setTarget, propertyKey);
      const { newValue, isDefaultPrevented } = callOnSetCallbacks(value, oldValue, fullPath);
      if (isDefaultPrevented) return;
      Reflect.set(setTarget, propertyKey, newValue);
      callOnAfterSetCallbacks(newValue, oldValue, fullPath);
    }
  }

  function onSet<R>(proxy: R, callback: OnSetCallback<R>, props?: OnSetProps): Unsubscribe;
  function onSet<R>(path: PropertyKey[], callback: OnSetCallback<R>, props?: OnSetProps): Unsubscribe;
  function onSet(...args: unknown[]): Unsubscribe {
    if (args.length < 2) throw new SyntaxError('This onSet function requires at least 2 arguments.');
    const path = pathFromArgs(args, proxyCache);
    const providedCallback = (typeof (args[1]) === 'function' ? args[1] : undefined) as OnSetCallback | undefined;
    const { includeSubProperties = false } = (args[2] != null && typeof (args[2]) === 'object' ? args[2] : {}) as OnSetProps;
    if (providedCallback == null) throw new SyntaxError('The callback function for this onSet function was invalid.');
    const callback: OnSetCallback = event => {
      if (!pathsMatch(path, event.path, includeSubProperties)) return;
      providedCallback(event);
    };
    onSetCallbacks.add(callback);
    return () => { onSetCallbacks.delete(callback); };
  }

  function onAfterSet<R>(proxy: R, callback: OnAfterSetCallback<R>, props?: OnSetProps): Unsubscribe;
  function onAfterSet<R>(path: PropertyKey[], callback: OnAfterSetCallback<R>, props?: OnAfterSetProps): Unsubscribe;
  function onAfterSet(...args: unknown[]): Unsubscribe {
    if (args.length < 2) throw new SyntaxError('This onAfterSet function requires at least 2 arguments.');
    const path = pathFromArgs(args, proxyCache);
    const providedCallback = (typeof (args[1]) === 'function' ? args[1] : undefined) as OnAfterSetCallback | undefined;
    const { includeSubProperties = false } = (args[2] != null && typeof (args[2]) === 'object' ? args[2] : {}) as OnAfterSetProps;
    if (providedCallback == null) throw new SyntaxError('The callback function for this onAfterSet function was invalid.');
    const callback: OnAfterSetCallback = event => {
      if (!pathsMatch(path, event.path, includeSubProperties)) return;
      providedCallback(event);
    };
    onAfterSetCallbacks.add(callback);
    return () => { onAfterSetCallbacks.delete(callback); };
  }

  return {
    set,
    onSet,
    onAfterSet,
  };
}

// export type CreateSetApi = ReturnType<typeof internalCreateSet>;

// export function createSet(props: Props): CreateSetApi {
//   return internalCreateSet(props);
// }
