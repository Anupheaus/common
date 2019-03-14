export interface ICancelAsyncToken {
  isCancelled: boolean;
  reason: string;
  cancel(): void;
  cancel(reason: string): void;
  onCancelled(delegate: () => void): void;
}

const tokens = new WeakMap<Promise<any>, ICancelAsyncToken>();

export function getCancellableAsyncToken(promise: Promise<any>): ICancelAsyncToken {
  console.log(promise);
  return tokens.get(promise);
}

function attachToken(delegate: (token: ICancelAsyncToken) => Promise<any>) {
  const onCancelledCallbacks: (() => void)[] = [];
  const token: ICancelAsyncToken = {
    isCancelled: false,
    reason: undefined,
    cancel(reason?: string): void {
      if (token.isCancelled) { return; }
      token.reason = reason;
      token.isCancelled = true;
      onCancelledCallbacks.forEach(callback => callback());
    },
    onCancelled(onCancelledDelegate: () => void): void { onCancelledCallbacks.push(onCancelledDelegate); },
  };
  const result = delegate(token);
  tokens.set(result, token);
  return result;
}

export function cancellableAsync<T extends (...args: any[]) => Promise<any>>(delegate: (token: ICancelAsyncToken) => T): T;
export function cancellableAsync(target: Object, propertyKey: PropertyKey, descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>):
  TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;
export function cancellableAsync(target: Object | ((token: ICancelAsyncToken) => Promise<any>), _propertyKey?: PropertyKey,
  descriptor?: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>): (TypedPropertyDescriptor<(...args: any[]) => Promise<any>>) | ((...args: any[]) => Promise<any>) {
  if (typeof (target) === 'function' && arguments.length === 1) {
    return (...args: any[]) => attachToken(token => target(token)(...args));
  } else {
    return {
      value: (...args: any[]) => attachToken(token => descriptor.value(...args, token)),
      enumerable: false,
      configurable: true,
      writable: false,
    };
  }
}
