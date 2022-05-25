interface Props {
  timeout: number;
  ignoreArguments?: boolean;
}

export function throttle(timeout: number): MethodDecorator;
export function throttle(props: Props): MethodDecorator;
export function throttle(propsOrTimeout: number | Props): MethodDecorator {
  const {
    timeout,
    ignoreArguments = false,
  }: Props = typeof (propsOrTimeout) === 'number' ? { timeout: propsOrTimeout } : propsOrTimeout;
  const defaultKey = Math.uniqueId();
  return (target: object, propertyKey: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor => {
    if (!propertyKey) throw new Error('@throttle decorator can only be applied to methods not a class');
    if (!descriptor) throw new Error('@throttle decorator can only be applied to methods not a variable');
    if (!descriptor.value) { return descriptor; }
    const fn = descriptor.value;
    const values = new Map<string, unknown>();

    return {
      value: function (...args: unknown[]) {
        const key = ignoreArguments === true ? defaultKey : Object.hash({ args });
        if (values.has(key)) return values.get(key);
        const value = fn.apply(this, args);
        values.set(key, value);
        setTimeout(() => {
          values.delete(key);
        }, timeout);
        return value;
      },
      configurable: true,
      enumerable: true,
      writable: false,
    };
  };
}

