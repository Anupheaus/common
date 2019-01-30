import { MathExtensions } from './mathExtensions';

// tslint:disable:interface-name

Object.extendPrototype(Math, MathExtensions.prototype);
declare global { interface Math extends MathExtensions { } }
