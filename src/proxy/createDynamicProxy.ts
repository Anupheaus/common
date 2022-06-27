import { createProxyOf } from './createProxyOf';
import { OnAfterSetEvent, OnDefaultEvent, OnGetEvent, OnSetEvent } from './publicModels';

interface Props {
  onGet?(event: OnGetEvent): void;
  onSet?(event: OnSetEvent): void;
  onAfterSet?(event: OnAfterSetEvent): void;
  onDefault?(event: OnDefaultEvent): void;
}

export function createDynamicProxy<T extends object>({ onGet: providedOnGet, onSet: providedOnSet, onAfterSet: providedOnAfterSet, onDefault: providedOnDefault }: Props = {}) {
  const result = createProxyOf({} as T);
  const { proxy, onGet, onSet, onAfterSet, onDefault } = result;

  if (providedOnGet != null) onGet(proxy, providedOnGet, { includeSubProperties: true });
  if (providedOnSet != null) onSet(proxy, providedOnSet, { includeSubProperties: true });
  if (providedOnAfterSet != null) onAfterSet(proxy, providedOnAfterSet, { includeSubProperties: true });
  if (providedOnDefault != null) onDefault(proxy, providedOnDefault, { includeSubProperties: true });

  return result;
}
