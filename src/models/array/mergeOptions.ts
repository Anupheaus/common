import { ISyncWithOptions } from './syncOptions';

export const MergeWithUpdateOperations = {
  UseTargetIfDifferent: (item1: any, item2: any) => item1 === item2 ? item1 : item2,
  KeepSource: (item1: any) => item1,
  KeepTarget: (_item1: any, item2: any) => item2,
  Merge: (item1: any, item2: any) => Object.merge(item1, item2),
};

export interface IMergeWithOptions<T, P> extends ISyncWithOptions<T, P> {
  removeUnmatched?: boolean | ((item: T) => boolean);
  addNew?: boolean | ((item: P) => boolean);
  matchOrder?: boolean;
}
