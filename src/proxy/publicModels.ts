export interface OnGetEvent<T = unknown> {
  value: T;
  readonly path: PropertyKey[];
}
export type OnGetCallback<T = unknown> = (event: OnGetEvent<T>) => void;

export interface OnSetEvent<T = unknown, R = T> {
  newValue: T;
  readonly oldValue: R;
  readonly path: PropertyKey[];
  readonly isDefaultPrevented: boolean;
  preventDefault(): void;
}
export type OnSetCallback<T = unknown> = (event: OnSetEvent<T>) => void;

export interface OnAfterSetEvent<T = unknown, R = T> {
  newValue: T;
  readonly oldValue: R;
  readonly path: PropertyKey[];
}
export type OnAfterSetCallback<T = unknown> = (event: OnAfterSetEvent<T>) => void;

export interface OnDefaultEvent<T = unknown> {
  readonly traversedPath: PropertyKey[];
  readonly remainingPath: PropertyKey[];
  value: T;
}
export type OnDefaultCallback<T = unknown> = (event: OnDefaultEvent<T>) => void;

export type ProxyOf<T> = { [K in keyof T]: ProxyOf<T[K]> };