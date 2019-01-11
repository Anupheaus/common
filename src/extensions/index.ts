import 'datejs';
import './object';
import * as AllArrayExports from './array';
import './date';
import './function';
import * as AllMathExports from './math';
import './promise';
import './reflect';
import './string';

const { ArrayExtensions, ...ArrayExports } = AllArrayExports;
const { MathExtensions, ...MathExports } = AllMathExports;

export * from './is';
export * from './global';
export * from './date';
export * from './to';
export default { ...ArrayExports, ...MathExports };
