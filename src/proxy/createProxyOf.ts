/* eslint-disable max-classes-per-file */
import { getProxyApiSymbol, isProxySymbol } from './privateModels';
import type { ProxyContext } from './privateModels';
import { createInternalApi } from './internalApi';
import type { InternalApi } from './internalApi';
import { createGet } from './get';
import { createIsSet } from './isSet';
import { createSet } from './set';
import type { OnSetProps } from './set';
import { createOnDefault } from './onDefault';
import type { ProxyOf } from './publicModels';
import { convertToCorrectPropertyType } from './proxyUtils';

const proxyCache = new WeakMap<object, ProxyContext>();
const rootKey: PropertyKey = Symbol('root');

export interface ProxyApi<T = unknown> {
  value: T;
  isSet: boolean;
  onSet(callback: (newValue: T) => void, props?: OnSetProps): void;
  set(newValue: T): void;
}

class GetProxyApiTypes<T extends object> { public set() { return createSet<T>({} as any); } }

interface FullInternalProxyApi<T extends object = object> {
  get: ReturnType<typeof createGet>['get'];
  onGet: ReturnType<typeof createGet>['onGet'];
  isSet: ReturnType<typeof createIsSet>['isSet'];
  set: ReturnType<GetProxyApiTypes<T>['set']>['set'];
  onSet: ReturnType<GetProxyApiTypes<T>['set']>['onSet'];
  onAfterSet: ReturnType<GetProxyApiTypes<T>['set']>['onAfterSet'];
}

function getProxyApi(cache: Map<PropertyKey, () => ProxyApi>, context: ProxyContext, fullApi: FullInternalProxyApi): ProxyApi {
  let propertyKey = context.path[context.path.length - 1];
  if (propertyKey === null) propertyKey = rootKey;
  if (cache.has(propertyKey)) return cache.get(propertyKey)!();
  const proxyApi = (): ProxyApi => ({
    value: fullApi.get(context.path),
    isSet: fullApi.isSet(context.path),
    onSet: (callback, props) => fullApi.onSet(context.path, callback, props),
    set: newValue => fullApi.set(context.path, newValue),
  });
  cache.set(propertyKey, proxyApi);
  return proxyApi();
}

function createProxy(context: ProxyContext, internalApi: InternalApi, fullApi: FullInternalProxyApi): object {
  const internalCache = new Map<PropertyKey, object>();
  const apiCache = new Map<PropertyKey, () => ProxyApi>();
  const proxy = new Proxy({}, {
    get: (_target, providedPropertyKey) => {
      if (providedPropertyKey === isProxySymbol) return true;
      if (providedPropertyKey === getProxyApiSymbol) return getProxyApi(apiCache, context, fullApi);
      const propertyKey = convertToCorrectPropertyType(providedPropertyKey);
      if (internalCache.has(propertyKey)) return internalCache.get(propertyKey);
      const result = createProxy({ path: [...context.path, propertyKey] }, internalApi, fullApi);
      internalCache.set(propertyKey, result);
      return result;
    },
    has: (_target, providedPropertyKey) => {
      const propertyKey = convertToCorrectPropertyType(providedPropertyKey);
      return internalApi.get([...context.path, propertyKey]).isSet;
    },
    getOwnPropertyDescriptor: (_target, providedPropertyKey) => {
      const propertyKey = convertToCorrectPropertyType(providedPropertyKey);
      const { value, isSet } = internalApi.get(context.path);
      if (!isSet || value == null || typeof (value) !== 'object') return undefined;
      return Reflect.getOwnPropertyDescriptor(value, propertyKey);
    },
    ownKeys: () => {
      const { value, isSet } = internalApi.get(context.path);
      if (!isSet || value == null || typeof (value) !== 'object') return [];
      return Reflect.ownKeys(value);
    }
  });
  proxyCache.set(proxy, context);
  return proxy;
}

function internalCreateProxyOf<T extends object>(target: T) {
  const api = createInternalApi(target);

  const { get, onGet } = createGet<T>({ proxyCache, api });
  const { isSet } = createIsSet({ proxyCache, api });
  const { raiseOnDefault, onDefault } = createOnDefault({ proxyCache });
  const { set, onSet, onAfterSet } = createSet<T>({ proxyCache, target, raiseOnDefault });

  const fullApi = {
    get,
    onGet,
    isSet,
    set,
    onSet,
    onAfterSet,
  } as unknown as FullInternalProxyApi;

  const proxyInstance = createProxy({ path: [] }, api, fullApi) as ProxyOf<T>;

  return {
    proxy: proxyInstance,
    get,
    isSet,
    set,
    onGet,
    onSet,
    onAfterSet,
    onDefault,
  };
}

class GetProxyOfApi<T extends object> { public get type() { return internalCreateProxyOf<T>({} as T); } }
export type ProxyOfApi<T extends object> = GetProxyOfApi<T>['type'];

export function createProxyOf<T extends object>(target: T): ProxyOfApi<T> {
  return internalCreateProxyOf(target);
}

