import { is } from '../extensions';
import type { ProxyApi } from './createProxyOf';
import { getProxyApiSymbol } from './privateModels';
import type { ProxyOf } from './publicModels';

export function getProxyApiFrom<T>(target: T | ProxyOf<T>): ProxyApi<T> | undefined {
  if (!is.proxy(target)) return;
  return (target as any)[getProxyApiSymbol] as ProxyApi<T>;
}