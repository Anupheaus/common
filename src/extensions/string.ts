import './object';
import { StringExtensions, StringConstructorExtensions } from './stringExtensions';

Object.extendPrototype(String.prototype, StringExtensions.prototype);
Object.extendPrototype(String, StringConstructorExtensions.prototype);

declare global {
  interface String extends StringExtensions { }
  interface StringConstructor extends StringConstructorExtensions { }
}
