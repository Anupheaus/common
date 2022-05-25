export interface DynamicProxyApi<T = unknown> {
  get(): T | undefined;
  set(value: T): T;
  onChanged(delegate: (newValue: T, oldValue: T | undefined) => void): () => void;
  onSubPropertyChanged(callback: () => void): () => void;
}
