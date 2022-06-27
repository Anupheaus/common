import { ProxyContext } from './privateModels';
import { createInternalApi, InternalApi } from './internalApi';
import { createGet } from './get';
import { createIsSet } from './isSet';
import { createSet } from './set';
import { createOnDefault } from './onDefault';
import { ProxyOf } from './publicModels';
import { convertToCorrectPropertyType } from './proxyUtils';
import { traverseObject } from './traverse';

const proxyCache = new WeakMap<object, ProxyContext>();

function createProxy(context: ProxyContext, internalApi: InternalApi): object {
  const internalCache = new Map<PropertyKey, object>();
  const proxy = new Proxy({}, {
    get: (target, providedPropertyKey) => {
      const propertyKey = convertToCorrectPropertyType(providedPropertyKey);
      if (internalCache.has(propertyKey)) return internalCache.get(propertyKey);
      const result = createProxy({ path: [...context.path, propertyKey] }, internalApi);
      internalCache.set(propertyKey, result);
      return result;
    },
    has: (target, providedPropertyKey) => {
      const propertyKey = convertToCorrectPropertyType(providedPropertyKey);
      return internalApi.get([...context.path, propertyKey]).isSet;
    },
    getOwnPropertyDescriptor: (target, providedPropertyKey) => {
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
  const proxyInstance = createProxy({ path: [] }, api) as ProxyOf<T>;

  const { get, onGet } = createGet({ proxyCache, api });
  const { isSet } = createIsSet({ proxyCache, api });
  const { raiseOnDefault, onDefault } = createOnDefault({ proxyCache });
  const { set, onSet, onAfterSet } = createSet({ proxyCache, target, raiseOnDefault });

  return {
    proxy: proxyInstance,
    get,
    isSet,
    set,
    onGet,
    onSet,
    onAfterSet,
    onDefault,
    traverse: traverseObject,
  };
}

class GetProxyOfApi<T extends object> { public get type() { return internalCreateProxyOf<T>({} as T); } }
export type ProxyOfApi<T extends object> = GetProxyOfApi<T>['type'];

export function createProxyOf<T extends object>(target: T): ProxyOfApi<T> {
  return internalCreateProxyOf(target);
}

