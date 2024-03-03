import type { InternalApi } from './internalApi';

export const isProxySymbol = Symbol('is_proxy');

export const getProxyApiSymbol = Symbol('get_proxy_api');

export interface ProxyContext {
  path: PropertyKey[];
}

export type ProxyCache = WeakMap<object, ProxyContext>;

export interface CommonProps {
  proxyCache: ProxyCache;
  api: InternalApi;
}
