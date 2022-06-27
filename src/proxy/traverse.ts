export interface TraversalResult<T = unknown> {
  isSet: boolean;
  value: T;
}

const emptyResult: TraversalResult = { isSet: false, value: undefined };

interface CommonTraverseProps {
  set?(path: PropertyKey[], value: unknown): void;
  onEmptyProperty?(traversedPath: PropertyKey[], remainingPath: PropertyKey[]): TraversalResult;
}

interface InternalTraverseProps extends CommonTraverseProps {
  target: unknown;
  isSet: boolean;
  remainingPath: PropertyKey[];
  traversedPath?: PropertyKey[];
}

function internalTraverse({ target, isSet: targetIsSet, remainingPath, traversedPath = [], set, onEmptyProperty }: InternalTraverseProps): TraversalResult {
  if (target == null) {
    if (onEmptyProperty == null || set == null || targetIsSet) return { ...emptyResult, isSet: targetIsSet };
    const { value, isSet } = onEmptyProperty(traversedPath, remainingPath);
    if (!isSet) return emptyResult;
    target = value;
    set(traversedPath, target);
    if (target == null) throw new Error('Unable to set a default value for a parent property when setting this value.');
  }
  if (remainingPath.length === 0) return { isSet: true, value: target };
  if (typeof (target) !== 'object') return emptyResult;
  const isSet = Reflect.has(target as object, remainingPath[0]);
  const value = Reflect.get(target as object, remainingPath[0]);
  return internalTraverse({ target: value, isSet, remainingPath: remainingPath.slice(1), traversedPath: [...traversedPath, remainingPath[0]], set, onEmptyProperty });
}

export interface TraverseProps extends CommonTraverseProps { }

export function traverseObject<T extends object>(target: T, path: PropertyKey[], props?: TraverseProps): TraversalResult<T> {
  return internalTraverse({ target, isSet: target != null, remainingPath: path, ...props }) as TraversalResult<T>;
}