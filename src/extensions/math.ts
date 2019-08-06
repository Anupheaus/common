import { MathExtensions } from './mathExtensions';

Object.extendPrototype(Math, MathExtensions.prototype);

declare global { interface Math extends MathExtensions { } }
