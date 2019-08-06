import { createCustomEqual } from 'fast-equals';
import { InternalError } from '../errors';
import { is } from './is';
import './object';

export enum PropertyAccess {
  CanRead,
  CanWrite,
}

const fastEquals = (customComparer: (source, target) => boolean | void, isDeepComparison?: boolean) => {
  const hasCustomComparer = typeof (customComparer) === 'function';
  return createCustomEqual(comparitor => (objA, objB) => {
    if (hasCustomComparer) {
      const result = customComparer(objA, objB);
      if (result === true || result === false) { return result; }
    }
    if (typeof (objA) === 'function' && typeof (objB) === 'function' && objA.toString() === objB.toString()) { return true; }
    if (!isDeepComparison && typeof (objA) === 'object' && typeof (objB) === 'object') {
      if (!(objA instanceof Date)) { return objA === objB; }
    }
    const finalResult = comparitor(objA, objB);
    return isDeepComparison ? finalResult : finalResult === true;
  });
};

function performComparison(source: unknown, target: unknown,
  customComparer: (source: unknown, target: unknown) => boolean | void, isDeepComparison: boolean): boolean {
  if (typeof (customComparer) === 'function') {
    const firstResult = customComparer(source, target);
    if (firstResult === true || firstResult === false) { return firstResult; }
  }
  return fastEquals(customComparer, isDeepComparison)(source, target);
}

declare global {

  namespace Reflect {

    interface IEndOfPathAction {
      value: unknown;
      shouldContinue: boolean;
    }

    export interface ITypeOf<T = unknown> {
      type: string;
      isArray: boolean;
      isObject: boolean;
      isPrototype: boolean;
      isInstance: boolean;
      isNull: boolean;
      isUndefined: boolean;
      isNullOrUndefined: boolean;
      isBoolean: boolean;
      isNumber: boolean;
      isString: boolean;
      isPrimitive: boolean;
      isFunction: boolean;
      isDate: boolean;
      value: T;
    }

    function isOrDerivesFrom(source: unknown, derivesFrom: unknown): boolean;

    function className(instance: unknown): string;

    function getDefinition(target: unknown, memberKey: PropertyKey): PropertyDescriptor;

    function getAllDefinitionsForMember(target: unknown, memberName: string): PropertyDescriptor[];

    function getAllDefinitions(target: unknown): PropertyDescriptorMap;

    function getProperty<T>(target: unknown, propertyName: string): T;
    function getProperty<T>(target: unknown, propertyName: string, defaultValue: T): T;
    function getProperty<T>(target: unknown, propertyName: string, defaultValue: T, addIfNotExists: boolean): T;

    function setProperty<T>(target: unknown, propertyName: string, value: T): void;

    function checkPropertyAccess(target: unknown, propertyName: string, access: PropertyAccess): boolean;

    function getAllPrototypesOf(target: unknown): Object[];

    function invokeAll(target: unknown, name: string, ...args: unknown[]): unknown[];

    function getAndCombineAll<T extends {}>(target: unknown, propertyName: string): T;

    function parameterNames(func: Function): string[];

    function areDeepEqual(source, target): boolean;
    function areDeepEqual(source, target, customComparer: (objA, objB) => boolean | void): boolean;
    function areShallowEqual(source, target): boolean;
    function areShallowEqual(source, target, customComparer: (objA, objB) => boolean | void): boolean;

    function wrapMethod<T extends Function, R>(target: object, method: T, delegate: (originalFunc: T, args: unknown[]) => R): R;

    function hashesOf(target: unknown): number[];

    function typeOf<T>(value: T): ITypeOf<T>;

  }
}

function navigateToProperty(target: object, propertyName: string,
  endOfPathAction: (target: object, propertyName: string) => Reflect.IEndOfPathAction = () => ({ value: null, shouldContinue: false })): [object, string] {
  const propertyNames = propertyName.split('.');
  let currentProperty = propertyNames.shift();
  let currentTarget = target;
  while (propertyNames.length > 0) {
    const value = currentTarget[currentProperty];
    if (value === undefined) {
      const result = endOfPathAction(value, currentProperty);
      if (!is.null(result.value)) {
        Reflect.defineProperty(currentTarget, currentProperty, { value: result.value, enumerable: false, writable: true, configurable: true });
        if (!result.shouldContinue) { break; }
      }
    }
    currentTarget = currentTarget[currentProperty];
    currentProperty = propertyNames.shift();
  }
  if (propertyNames.length > 0) { return [null, '']; }
  return [currentTarget, currentProperty];
}

Object.addMethods(Reflect, [

  function isOrDerivesFrom(source: unknown, derivesFrom: unknown): boolean {
    let sourcePrototype = typeof (source) === 'function' ? source.prototype : source;
    if (sourcePrototype == null) { return false; }
    const derivesFromPrototype = typeof (derivesFrom) === 'function' ? derivesFrom.prototype : derivesFrom;
    do {
      if (sourcePrototype === derivesFromPrototype) { return true; }
      sourcePrototype = Object.getPrototypeOf(sourcePrototype);
    } while (sourcePrototype !== Object.prototype);
    return false;
  },

  function className(instance: object): string {
    const prototype = Reflect.getPrototypeOf(instance);
    const constructor: Function = prototype.constructor;
    return constructor.name;
  },

  function getDefinition(target: object, memberKey: PropertyKey): PropertyDescriptor {
    if (!target) { return undefined; }
    let definition: PropertyDescriptor = null;
    // if (target.prototype) { target = target.prototype; }
    // if (target.constructor && target.constructor.prototype) { target = target.constructor.prototype; }
    do {
      definition = Reflect.getOwnPropertyDescriptor(target, memberKey) || null;
      if (definition === null) { target = Reflect.getPrototypeOf(target); }
    } while (definition === null && target !== Object.prototype);
    return definition;
  },

  function getAllDefinitionsForMember(target: object, memberName: string): PropertyDescriptor[] {
    const definitions = new Array<PropertyDescriptor>();
    do {
      const definition = Reflect.getOwnPropertyDescriptor(target, memberName) || null;
      if (!is.null(definition)) { definitions.push(definition); }
      target = Reflect.getPrototypeOf(target);
    } while (target !== Object.prototype);
    return definitions;
  },

  function getAllDefinitions(target: object): PropertyDescriptorMap {
    const descriptors: PropertyDescriptorMap = {};
    Reflect.getAllPrototypesOf(target)
      .mapMany(prototype => Object.getOwnPropertyNames(prototype).map(key => ({ key, descriptor: Reflect.getOwnPropertyDescriptor(prototype, key) })))
      .forEach(item => {
        if (descriptors[item.key]) { return; }
        descriptors[item.key] = item.descriptor;
      });
    return descriptors;
  },

  function getProperty<T>(target: object, propertyName: string, defaultValue: T = null, addIfNotExists: boolean = false): T {
    [target, propertyName] = navigateToProperty(target, propertyName, () => {
      if (!addIfNotExists) { return { value: null, shouldContinue: false }; }
      return { value: {}, shouldContinue: true };
    });
    if (target === null) { return defaultValue; }
    let result = target[propertyName];
    if (result === undefined && addIfNotExists) { Reflect.setProperty(target, propertyName, defaultValue); result = defaultValue; }
    return result;
  },

  function setProperty<T>(target: object, propertyName: string, value: T): void {
    [target, propertyName] = navigateToProperty(target, propertyName, () => ({ value: {}, shouldContinue: true }));
    if (target[propertyName] === undefined) {
      Reflect.defineProperty(target, propertyName, { value, writable: true, configurable: true, enumerable: false });
    } else if (Reflect.checkPropertyAccess(target, propertyName, PropertyAccess.CanWrite)) {
      target[propertyName] = value;
    } else {
      throw new InternalError('Unable to set property value because the property does not permit write access.', { target, property: propertyName });
    }
  },

  function checkPropertyAccess(target: object, propertyName: string, access: PropertyAccess): boolean {
    [target, propertyName] = navigateToProperty(target, propertyName);
    if (target === null) { throw new InternalError('Access was requested on a property that does not exist.', { target, propertyName, access }); }
    const definition = Reflect.getDefinition(target, propertyName);
    if (definition === null) { return false; }
    switch (access) {
      case PropertyAccess.CanWrite:
        return is.function(definition.set) || (definition.writable === true);
      case PropertyAccess.CanRead:
        return is.function(definition.get) || (definition.writable === true);
      default:
        return false;
    }
  },

  function getAllPrototypesOf(target: object): object[] {
    let prototype = target;
    const prototypes = new Array<object>();
    if (is.function(prototype)) { prototype = prototype.prototype; prototypes.push(prototype); }
    // tslint:disable-next-line:no-conditional-assignment
    while ((prototype = Reflect.getPrototypeOf(prototype)) !== Object.prototype) { prototypes.push(prototype); }
    return prototypes;
  },

  function invokeAll(target: object, name: string, ...args: unknown[]): unknown[] {
    return Reflect.getAllPrototypesOf(target)
      .map(prototype => {
        const methodDescriptor = Reflect.getOwnPropertyDescriptor(prototype, name);
        if (!is.null(methodDescriptor) && is.function(methodDescriptor.value)) { return methodDescriptor.value; }
        return null;
      })
      .removeNull()
      .map(method => method.apply(target, args));
  },

  function getAndCombineAll<T extends {}>(target: object, propertyName: string): T {
    const results = Reflect.getAllPrototypesOf(target)
      .map(prototype => {
        const propertyDescriptor = Reflect.getOwnPropertyDescriptor(prototype, propertyName);
        if (!is.null(propertyDescriptor) && is.function(propertyDescriptor.get)) { return propertyDescriptor.get; }
        return null;
      })
      .removeNull()
      .map(method => method.call(target))
      .removeNull()
      .reverse();
    return Object.merge<T>({}, ...results);
  },

  function parameterNames(func: Function): string[] {
    return func.toString()
      .replace(/[/][/].*$/mg, '') // strip single-line comments
      .replace(/\s+/g, '') // strip white space
      .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
      .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
      .replace(/=[^,]+/g, '') // strip any ES6 defaults
      .split(',').filter(Boolean); // split & filter [""]

  },

  function wrapMethod(target: object, method: Function, delegate: (originalMethod: Function, args: any[]) => any): any {
    Object.defineProperty(target, method.name, {
      value(...args: any[]) {
        args.unshift(method.bind(target));
        return delegate.apply(target, args);
      },
      configurable: true,
      enumerable: false,
      writable: false,
    });
  },

  function hashesOf(target: any): number[] {
    return Reflect.getAllPrototypesOf(target)
      .map(prototype => Object.hash(prototype))
      .removeByFilter(hash => hash === 0)
      .distinct();
  },

  function areDeepEqual(source, target, customComparer?: (objA, objB) => boolean | void): boolean {
    return performComparison(source, target, customComparer, true);
  },

  function areShallowEqual(source, target, customComparer?: (source, target) => boolean | void): boolean {
    return performComparison(source, target, customComparer, false);
  },

  function typeOf<T extends any = any>(value: T): Reflect.ITypeOf<T> {
    let type: string = typeof (value);
    const isArray = value instanceof Array;
    const isNull = value === null;
    const isUndefined = value === undefined;
    const isNullOrUndefined = isNull || isUndefined;
    const isDate = value instanceof Date;
    let isObject = type === 'object' && !isArray && !isNull && !isDate;
    let isFunction = type === 'function';
    let isPrototype = false;
    let isInstance = false;
    if (isObject && typeof (value.constructor) === 'function') {
      isPrototype = Object.getOwnPropertyNames(value).includes('constructor');
      isInstance = (!isPrototype && value.constructor.name !== 'Object');
      isObject = !(isPrototype || isInstance);
    } else if (isFunction && value.toString().indexOf('class') >= 0) {
      isPrototype = true;
      isFunction = false;
    }
    const isBoolean = type === 'boolean';
    const isNumber = type === 'number';
    const isString = type === 'string';

    const isPrimitive = isBoolean || isNumber || isString;
    type = isArray ? 'array' : isNull ? 'null' : type;
    return {
      type,
      isArray,
      isNull,
      isUndefined,
      isNullOrUndefined,
      isDate,
      isObject,
      isPrototype,
      isInstance,
      isBoolean,
      isNumber,
      isString,
      isFunction,
      isPrimitive,
      value,
    };
  },

]);
