import type { InternalApi } from './internalApi';

export interface ProxyContext {
  path: PropertyKey[];
}

export type ProxyCache = WeakMap<object, ProxyContext>;

export interface CommonProps {
  proxyCache: ProxyCache;
  api: InternalApi;
}
