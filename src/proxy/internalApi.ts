import { traverseObject } from './traverse';

export function createInternalApi(target: object) {
  return {
    get: (path: PropertyKey[]) => traverseObject(target, path),
  };
}

export type InternalApi = ReturnType<typeof createInternalApi>;
