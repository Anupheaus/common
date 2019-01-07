const boundMethods = Symbol('boundMethods');

function isAlreadyBound(target: object, key: PropertyKey): boolean {
  const methodsBound = target[boundMethods];
  if (!(methodsBound instanceof Array)) { return false; }
  return methodsBound.includes(key);
}

function saveBinding(target: object, key: PropertyKey): void {
  (target[boundMethods] = target[boundMethods] || []).push(key);
}

export function bind(target: any, key: PropertyKey, descriptor: PropertyDescriptor) {
  let fn = (descriptor || {}).value;

  if (typeof fn !== 'function') {
    const bindTarget = key && !descriptor && target ? 'a variable' : 'a class';
    throw new Error(`@bind decorator can only be applied to methods not ${bindTarget}`);
  }

  return {
    configurable: true,
    get() {
      const boundFn = fn.bind(this);
      if (!isAlreadyBound(this, key)) {
        saveBinding(this, key);
        Object.defineProperty(this, key, {
          configurable: true,
          get() { return boundFn; },
          set(value) { fn = value; delete this[key]; },
        });
      }
      return boundFn;
    },
    set(value: any) { fn = value; },
  };
}
