import { is } from '../extensions';
import { ProxyApi } from './createProxyOf';
import { getProxyApiSymbol } from './privateModels';
import { ProxyOf } from './publicModels';

export function getProxyApiFrom<T>(target: T | ProxyOf<T>): ProxyApi<T> | undefined {
  if (!is.proxy(target)) return;
  return (target as any)[getProxyApiSymbol] as ProxyApi<T>;
}