import { __DYNAMIC_PROXY__ } from './internal';
import { DynamicProxyApi } from './models';

export function withFunc<T>(target: T): DynamicProxyApi<T> {
  if (target == null) throw new Error('Unable to accept a null or undefined value when trying to retrieve the proxy api for this target.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const api = (target as any)[__DYNAMIC_PROXY__] as DynamicProxyApi<T>;
  if (!api) throw new Error('Unable to find the proxy api for this target; target may not be a valid proxy.');
  return api;
}