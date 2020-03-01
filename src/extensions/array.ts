import { ArrayExtensions, ArrayConstructorExtensions } from './arrayExtensions';


Object.extendPrototype(Array.prototype, ArrayExtensions.prototype);
Object.extendPrototype(Array, ArrayConstructorExtensions.prototype);

declare global {
  interface Array<T> extends ArrayExtensions<T> { }
  interface ArrayConstructor extends ArrayConstructorExtensions { }
}
