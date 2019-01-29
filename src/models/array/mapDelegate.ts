export type SimpleMapDelegate<T, V = any> = (item: T) => V;
export type MapDelegate<T, V = any> = (item: T, index: number) => V;
