export interface IMatchedArrayDiffItem<T, P> {
  sourceItem: T;
  targetItem: P;
}

export interface IArrayDiff<T, P> {
  added: P[];
  removed: T[];
  matched: IMatchedArrayDiffItem<T, P>[];
}
