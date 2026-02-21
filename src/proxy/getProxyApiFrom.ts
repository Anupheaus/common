import type { ProxyApi } from './createProxyOf';
import { getProxyApiSymbol, isProxySymbol } from './privateModels';
import type { ProxyOf } from './publicModels';

function isProxy(target: unknown): boolean {
  return target != null && typeof target === 'object' && (target as any)[isProxySymbol] === true;
}

export function getProxyApiFrom<T>(target: T | ProxyOf<T>): ProxyApi<T> | undefined {
  if (!isProxy(target)) return;
  return (target as any)[getProxyApiSymbol] as ProxyApi<T>;
}