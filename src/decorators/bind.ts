const isPrototype = (target: object) => Object.getOwnPropertyNames(target).includes('constructor');

function defineGetterOn(target: object, key: PropertyKey, func: Function): void {
  if (Reflect.getOwnPropertyDescriptor(target, key)?.get != null) { return; }
  Reflect.defineProperty(target, key, {
    get() {
      return isPrototype(this) ? func : func.bind(this);
    },
    configurable: true,
    enumerable: true,
  });
}

export function bind(_target: object, key: PropertyKey, descriptor: PropertyDescriptor): PropertyDescriptor {
  if (!key) throw new Error('@bind decorator can only be applied to methods not a class');
  if (!descriptor) throw new Error('@bind decorator can only be applied to methods not a variable');
  if (!descriptor.value) { return descriptor; }
  const fn = descriptor.value;
  return {
    get() {
      if (isPrototype(this)) {
        defineGetterOn(this, key, fn);
        return fn;
      } else {
        return fn.bind(this);
      }
    },
    set(value) {
      defineGetterOn(this, key, value);
    },
    configurable: true,
    enumerable: true,
  };
}

