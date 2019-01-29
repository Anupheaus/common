import { MathExtensions } from './mathExtensions';

// tslint:disable-next-line:interface-name
declare global { interface Math extends MathExtensions { } }
Object.extendPrototype(Math, MathExtensions.prototype);
