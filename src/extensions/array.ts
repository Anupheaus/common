import { ArrayExtensions, ArrayConstructorExtensions } from './arrayExtensions';

// tslint:disable:interface-name

Object.extendPrototype(Array.prototype, ArrayExtensions.prototype);
Object.extendPrototype(Array, ArrayConstructorExtensions);

declare global {
  interface Array<T> extends ArrayExtensions<T> { }
  interface ArrayConstructor extends ArrayConstructorExtensions { }
}
