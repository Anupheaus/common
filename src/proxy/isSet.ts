import { CommonProps } from './privateModels';
import { pathFromArgs } from './proxyUtils';

interface Props extends CommonProps { }

export function createIsSet({ proxyCache, api }: Props) {
  function isSet(proxy: unknown): boolean;
  function isSet(path: PropertyKey[]): boolean;
  function isSet(...args: unknown[]): boolean {
    const path = pathFromArgs(args, proxyCache);
    return api.get(path).isSet;
  }

  return {
    isSet,
  };
}