export type SimpleMapDelegate<T, V = unknown> = (item: T) => V;
export type MapDelegate<T, V = unknown> = (item: T, index: number) => V;
