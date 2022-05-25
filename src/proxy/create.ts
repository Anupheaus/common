import { AnyObject } from '../extensions';
import { __DYNAMIC_PROXY__ } from './internal';
import { DynamicProxyApi } from './models';

function isANumber(value: PropertyKey): boolean {
  const result = Number.parseInt(value.toString());
  return result !== Number.NaN && result.toString() === value.toString().trim();
}

interface InternalApi extends DynamicProxyApi {
  getOrCreateParent(usingProperty: PropertyKey): unknown;
  getDynamicApi(): DynamicProxyApi;
  informParentOfChange(): void;
}

interface Callback {
  callback(...args: unknown[]): void;
  triggerOnAnySubPropertyChange: boolean;
}

function invokeCallbacks(callbacks: Set<Callback>, newValue: unknown, oldValue: unknown, isFromParent: boolean): void {
  callbacks.forEach(({ callback, triggerOnAnySubPropertyChange }) => {
    if (isFromParent && triggerOnAnySubPropertyChange !== true) return;
    callback(newValue, oldValue);
  });
}

function registerCallback(callbacks: Set<Callback>, triggerOnAnySubPropertyChange: boolean) {
  return (callback: (...args: unknown[]) => void) => {
    const callbackObj = { callback, triggerOnAnySubPropertyChange };
    callbacks.add(callbackObj);
    return () => { callbacks.delete(callbackObj); };
  };
}

const createDynamicApiFrom = ({ get, set, onChanged, onSubPropertyChanged }: InternalApi): DynamicProxyApi => ({ get, set, onChanged, onSubPropertyChanged });

function createInternalApiUsing(api: InternalApi, property: PropertyKey): InternalApi {
  let dynamicApi: DynamicProxyApi | undefined;
  const callbacks = new Set<Callback>();
  const internalApi: InternalApi = {
    get: () => {
      const parentTarget = api.get() as object;
      if (parentTarget == null) return undefined;
      return Reflect.get(parentTarget as object, property);
    },
    set: (value: unknown) => {
      const oldValue = internalApi.get();
      const parent = api.getOrCreateParent(property) as object;
      if (value === oldValue) return oldValue;
      Reflect.set(parent, property, value);
      invokeCallbacks(callbacks, value, oldValue, false);
      api.informParentOfChange();
      return value;
    },
    getOrCreateParent: (usingProperty: PropertyKey) => {
      const parent = api.getOrCreateParent(property) as object;
      let self = Reflect.get(parent, property);
      if (self == null) {
        const oldValue = self;
        self = isANumber(usingProperty) ? [] : {};
        Reflect.set(parent, property, self);
        invokeCallbacks(callbacks, self, oldValue, false);
      }
      return self;
    },
    getDynamicApi: (): DynamicProxyApi => {
      if (!dynamicApi) dynamicApi = createDynamicApiFrom(internalApi);
      return dynamicApi;
    },
    onChanged: registerCallback(callbacks, false),
    onSubPropertyChanged: registerCallback(callbacks, true),
    informParentOfChange: () => {
      const value = internalApi.get();
      invokeCallbacks(callbacks, value, value, true);
      api.informParentOfChange();
    },
  };
  return internalApi;
}

function internalCreate(api: InternalApi): unknown {
  const proxyStore = new Map<PropertyKey, unknown>();
  return new Proxy({}, {
    get: (target: AnyObject, property: PropertyKey) => {
      if (property === __DYNAMIC_PROXY__) {
        return api.getDynamicApi();
      } else {
        const proxy = proxyStore.get(property) ?? internalCreate(createInternalApiUsing(api, property));
        proxyStore.set(property, proxy);
        return proxy;
      }
    },
  });
}

export function create<T extends AnyObject>(target: T): T {
  const callbacks = new Set<Callback>();
  const api: InternalApi = {
    get: () => target,
    set: () => { throw new Error('Cannot set the root object in a proxy.'); },
    getOrCreateParent: () => target,
    getDynamicApi: () => createDynamicApiFrom(api),
    onChanged: () => { throw new Error('Cannot register a onChanged event on the root object in a proxy.'); },
    onSubPropertyChanged: registerCallback(callbacks, true),
    informParentOfChange: () => { callbacks.forEach(({ callback }) => callback()); },
  };
  return internalCreate(api) as T;
}
