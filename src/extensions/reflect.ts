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
  return (createCustomEqual as any)(comparitor => (objA, objB) => {
    if (hasCustomComparer) {
      const result = customComparer(objA, objB);
      if (result === true || result === false) { return result; }
    }
    const finalResult = comparitor(objA, objB);
    return isDeepComparison ? finalResult : finalResult === true;
  });
};

function performComparison(source: any, target: any, customComparer: (source, target) => boolean | void, isDeepComparison): boolean {
  if (typeof (customComparer) === 'function') {
    const firstResult = customComparer(source, target);
    if (firstResult === true || firstResult === false) { return firstResult; }
  }
  return fastEquals(customComparer, isDeepComparison)(source, target);
}

declare global {

  namespace Reflect {

    interface IEndOfPathAction {
      value: any;
      shouldContinue: boolean;
    }

    export interface ITypeOf<T = any> {
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

    function isOrDerivesFrom(source: any, derivesFrom: any): boolean;

    function className(instance: any): string;

    function getDefinition(target: any, memberKey: PropertyKey): PropertyDescriptor;

    function getAllDefinitionsForMember(target: any, memberName: string): PropertyDescriptor[];

    function getAllDefinitions(target: any): PropertyDescriptorMap;

    function getProperty<T>(target: any, propertyName: string): T;
    function getProperty<T>(target: any, propertyName: string, defaultValue: T): T;
    function getProperty<T>(target: any, propertyName: string, defaultValue: T, addIfNotExists: boolean): T;

    function setProperty<T>(target: any, propertyName: string, value: T): void;

    function checkPropertyAccess(target: any, propertyName: string, access: PropertyAccess): boolean;

    function getAllPrototypesOf(target: any): Object[];

    function invokeAll(target: any, name: string, ...args: any[]): any[];

    function getAndCombineAll<T extends {}>(target: any, propertyName: string): T;

    function parameterNames(func: Function): string[];

    function areDeepEqual(source, target): boolean;
    function areDeepEqual(source, target, customComparer: (objA, objB) => boolean | void): boolean;
    function areShallowEqual(source, target): boolean;
    function areShallowEqual(source, target, customComparer: (objA, objB) => boolean | void): boolean;

    function wrapMethod<T extends Function, R>(target: object, method: T, delegate: (originalFunc: T, args: any[]) => R): R;

    function hashesOf(target: any): number[];

    function typeOf<T>(value: T): ITypeOf<T>;

  }
}

function navigateToProperty(target: any, propertyName: string,
  endOfPathAction: (target: any, propertyName: string) => Reflect.IEndOfPathAction = () => ({ value: null, shouldContinue: false })): any[] {
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

  function isOrDerivesFrom(source: any, derivesFrom: any): boolean {
    let sourcePrototype = typeof (source) === 'function' ? source.prototype : source;
    const derivesFromPrototype = typeof (derivesFrom) === 'function' ? derivesFrom.prototype : derivesFrom;
    do {
      if (sourcePrototype === derivesFromPrototype) { return true; }
      sourcePrototype = Object.getPrototypeOf(sourcePrototype);
    } while (sourcePrototype !== Object.prototype);
    return false;
  },

  function className(instance: any): string {
    const prototype = Reflect.getPrototypeOf(instance);
    const constructor: Function = prototype.constructor;
    return constructor.name;
  },

  function getDefinition(target: any, memberKey: PropertyKey): PropertyDescriptor {
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

  function getAllDefinitionsForMember(target: any, memberName: string): PropertyDescriptor[] {
    const definitions = new Array<PropertyDescriptor>();
    do {
      const definition = Reflect.getOwnPropertyDescriptor(target, memberName) || null;
      if (!is.null(definition)) { definitions.push(definition); }
      target = Reflect.getPrototypeOf(target);
    } while (target !== Object.prototype);
    return definitions;
  },

  function getAllDefinitions(target: any): PropertyDescriptorMap {
    const descriptors: PropertyDescriptorMap = {};
    Reflect.getAllPrototypesOf(target)
      .mapMany(prototype => Object.getOwnPropertyNames(prototype).map(key => ({ key, descriptor: Reflect.getOwnPropertyDescriptor(prototype, key) })))
      .forEach(item => {
        if (descriptors[item.key]) { return; }
        descriptors[item.key] = item.descriptor;
      });
    return descriptors;
  },

  function getProperty<T>(target: any, propertyName: string, defaultValue: T = null, addIfNotExists: boolean = false): T {
    [target, propertyName] = navigateToProperty(target, propertyName, () => {
      if (!addIfNotExists) { return { value: null, shouldContinue: false }; }
      return { value: {}, shouldContinue: true };
    });
    if (target === null) { return defaultValue; }
    let result = target[propertyName];
    if (result === undefined && addIfNotExists) { Reflect.setProperty(target, propertyName, defaultValue); result = defaultValue; }
    return result;
  },

  function setProperty<T>(target: any, propertyName: string, value: T): void {
    [target, propertyName] = navigateToProperty(target, propertyName, () => ({ value: {}, shouldContinue: true }));
    if (target[propertyName] === undefined) {
      Reflect.defineProperty(target, propertyName, { value, writable: true, configurable: true, enumerable: false });
    } else if (Reflect.checkPropertyAccess(target, propertyName, PropertyAccess.CanWrite)) {
      target[propertyName] = value;
    } else {
      throw new InternalError('Unable to set property value because the property does not permit write access.', { target, property: propertyName });
    }
  },

  function checkPropertyAccess(target: any, propertyName: string, access: PropertyAccess): boolean {
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

  function getAllPrototypesOf(target: any): any[] {
    let prototype: any = target;
    const prototypes = new Array<any>();
    if (is.function(prototype)) { prototype = prototype.prototype; prototypes.push(prototype); }
    // tslint:disable-next-line:no-conditional-assignment
    while ((prototype = Reflect.getPrototypeOf(prototype)) !== Object.prototype) { prototypes.push(prototype); }
    return prototypes;
  },

  function invokeAll(target: any, name: string, ...args: any[]): any[] {
    return Reflect.getAllPrototypesOf(target)
      .map(prototype => {
        const methodDescriptor = Reflect.getOwnPropertyDescriptor(prototype, name);
        if (!is.null(methodDescriptor) && is.function(methodDescriptor.value)) { return methodDescriptor.value; }
        return null;
      })
      .removeNull()
      .map(method => method.apply(target, args));
  },

  function getAndCombineAll<T extends {}>(target: any, propertyName: string): T {
    return Object
      .merge<T>({}, ...Reflect
        .getAllPrototypesOf(target)
        .map(prototype => {
          const propertyDescriptor = Reflect.getOwnPropertyDescriptor(prototype, propertyName);
          if (!is.null(propertyDescriptor) && is.function(propertyDescriptor.get)) { return propertyDescriptor.get; }
          return null;
        })
        .removeNull()
        .map(method => method.call(target))
        .removeNull()
        .reverse(),
      );
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
