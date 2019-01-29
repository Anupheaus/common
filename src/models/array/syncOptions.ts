export interface ISyncWithOptions<T, P> {
  matchBy?(item1: T, item2: P): boolean;
  updateMatched?(item1: T, item2: P, item1Index: number, item2Index: number): T;
  updateUnmatched?(item1: T): T;
  createBy?(item2: P): T;
}
