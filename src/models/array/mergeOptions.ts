import type { ISyncWithOptions } from './syncOptions';

export const MergeWithUpdateOperations = {
  UseTargetIfDifferent<T1, T2>(item1: T1, item2: T2) { return item1 === item2 as unknown ? item1 : item2; },
  KeepSource<T>(item1: T) { return item1; },
  KeepTarget<T1, T2>(_item1: T1, item2: T2) { return item2; },
  Merge<T1, T2>(item1: T1, item2: T2) { return Object.merge(item1, item2); },
};

export interface IMergeWithOptions<T, P> extends ISyncWithOptions<T, P> {
  removeUnmatched?: boolean | ((item: T) => boolean);
  addNew?: boolean | ((item: P) => boolean);
  matchOrder?: boolean;
}
