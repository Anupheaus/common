import { InternalError } from '../errors/InternalError';
import { is } from './is';
import './array';
import './object';
import type { AnyObject } from './global';
import { DateTime } from 'luxon';

export enum PropertyAccess {
  CanRead,
  CanWrite,
}

// const fastEquals = (customComparer?: (source: unknown, target: unknown) => boolean | void, isDeepComparison?: boolean) => {
//   customComparer = typeof (customComparer) === 'function' ? customComparer : undefined;
//   return createCustomEqual(v=>({
//     ...v,
//     areObjectsEqual: (a: any, b: any, isEqual, meta: any) => {

//       return v.areObjectsEqual(a, b, isEqual, meta);
//     },
//   }))/*((objA: any, objB: any): any => {
//     if (customComparer) {
//       const result = customComparer(objA, objB);
//       if (result === true || result === false) { return result; }
//     }
//     if (typeof (objA) === 'function' && typeof (objB) === 'function' && objA.toString() === objB.toString()) { return true; }
//     if (!isDeepComparison && typeof (objA) === 'object' && typeof (objB) === 'object') {
//       if (!(objA instanceof Date)) { return objA === objB; }
//     }
//     const finalResult = comparitor(objA, objB);
//     return isDeepComparison ? finalResult : finalResult === true;
//   });*/
// };

// function performComparison(source: unknown, target: unknown, customComparer?: (source: unknown, target: unknown) => boolean | void, isDeepComparison = false): boolean {
//   return fastEquals(customComparer, isDeepComparison)(source, target);
// }

declare global {

  namespace Reflect {

    interface IEndOfPathAction {
      value: unknown;
      shouldContinue: boolean;
    }

    export interface TypeOf<T = object> {
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

    export interface WalkerProperty<T = unknown> {
      name: string;
      path: (string | number)[];
      parent: object | undefined;
      descriptor: PropertyDescriptor;
      propertyIndex: number;
      get(): T;
      set(value: T): void;
      rename(newName: string): void;
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

    function bindAllMethodsOn(target: unknown): void;

    function invoke(target: unknown, name: string, ...args: unknown[]): unknown;
    function invokeAll(target: unknown, name: string, ...args: unknown[]): unknown[];

    function getAndCombineAll<T extends {}>(target: unknown, propertyName: string): T;

    function parameterNames(func: Function): string[];

    /** @deprecated Please use is.deepEqual */
    function areDeepEqual(source: unknown, target: unknown): boolean;

    /** @deprecated Please use is.shallowEqual */
    function areShallowEqual(source: unknown, target: unknown): boolean;

    function wrapMethod<T extends Function, R>(target: object, method: T, delegate: (originalFunc: T, args: unknown[]) => R): R;

    function hashesOf(target: unknown): number[];

    function walk(target: object, onProperty: (property: Reflect.WalkerProperty) => void | false): void;

    function getByPath<T = unknown>(target: object, propertyKey: string): { wasFound: boolean; value: T; };
    function setByPath<T = unknown>(target: object, propertyKey: string, value: T): boolean;
    function setByPath<T = unknown>(target: object, propertyKey: string, value: T, createPathIfNotExists: boolean): boolean;

  }
}

function navigateToProperty(target: AnyObject, propertyName: string,
  endOfPathAction: (target: object, propertyName: string) => Reflect.IEndOfPathAction = () => ({ value: null, shouldContinue: false })): [AnyObject | undefined, string] {
  const propertyNames = propertyName.split('.');
  let currentProperty = propertyNames.shift();
  let currentTarget = target;
  while (propertyNames.length > 0 && currentProperty) {
    const value = currentTarget[currentProperty];
    if (value === undefined) {
      const result = endOfPathAction(currentTarget, currentProperty);
      if (result.value != null) {
        Reflect.defineProperty(currentTarget, currentProperty, { value: result.value, enumerable: false, writable: true, configurable: true });
        if (!result.shouldContinue) { break; }
      }
    }
    currentTarget = currentTarget[currentProperty] as never;
    currentProperty = propertyNames.shift();
  }
  if (propertyNames.length > 0) { return [undefined, '']; }
  return [currentTarget, currentProperty ?? ''];
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

  function className(target: unknown): string {
    if (is.instance(target)) return target.constructor.name;
    if (is.prototype(target)) return target.name;
    throw new Error('The type of the target provided was neither an instance or a class definition.');
  },

  function getDefinition(target: object, memberKey: PropertyKey): PropertyDescriptor | undefined {
    if (!target) { return undefined; }
    let definition: PropertyDescriptor | undefined;
    // if (target.prototype) { target = target.prototype; }
    // if (target.constructor && target.constructor.prototype) { target = target.constructor.prototype; }
    let nullableTarget: object | null = target;
    do {
      if (nullableTarget == null || nullableTarget == Object.prototype) break;
      definition = Reflect.getOwnPropertyDescriptor(nullableTarget, memberKey);
      if (definition == null) { nullableTarget = Reflect.getPrototypeOf(nullableTarget); }
    } while (definition == null);
    return definition;
  },

  function getAllDefinitionsForMember(target: object, memberName: string): PropertyDescriptor[] {
    const definitions = new Array<PropertyDescriptor>();
    let nullableTarget: object | null = target;
    do {
      if (nullableTarget == null || nullableTarget === Object.prototype) break;
      const definition = Reflect.getOwnPropertyDescriptor(nullableTarget, memberName) || null;
      if (definition != null) { definitions.push(definition); }
      nullableTarget = Reflect.getPrototypeOf(nullableTarget);
    } while (true); // eslint-disable-line no-constant-condition
    return definitions;
  },

  function getAllDefinitions(target: object): PropertyDescriptorMap {
    const descriptors: AnyObject = {};
    Reflect.getAllPrototypesOf(target)
      .mapMany(prototype => Object.getOwnPropertyNames(prototype)
        .map(key => ({ key, descriptor: Reflect.getOwnPropertyDescriptor(prototype, key) as PropertyDescriptor }))
        .filter(item => item.descriptor != null))
      .forEach(item => {
        if (descriptors[item.key]) { return; }
        descriptors[item.key] = item.descriptor;
      });
    return descriptors as PropertyDescriptorMap;
  },

  function bindAllMethodsOn(target: unknown): void {
    const prototype = is.instance(target) ? target.constructor.prototype : is.prototype(target) ? target.prototype : undefined;
    if (!prototype) throw new Error('Unable to retrieve prototype from target provided.');
    const definitions = Reflect.getAllDefinitions(target);
    Object.entries(definitions)
      .filter(([, definition]) => typeof (definition.value) === 'function')
      .forEach(([property, definition]) => {
        const fn = definition.value;
        Reflect.defineProperty(prototype, property, {
          get() { return fn.bind(this); },
          configurable: true,
          enumerable: true,
        });
      });
  },

  function getProperty<T>(target: AnyObject, propertyName: string, defaultValue?: T, addIfNotExists = false): T | undefined {
    const [newTarget, newPropertyName] = navigateToProperty(target, propertyName, () => {
      if (!addIfNotExists) { return { value: null, shouldContinue: false }; }
      return { value: {}, shouldContinue: true };
    });
    if (newTarget == null) { return defaultValue; }
    let result = newTarget[newPropertyName];
    if (result === undefined && addIfNotExists) { Reflect.setProperty(newTarget, newPropertyName, defaultValue); result = defaultValue; }
    return result as T;
  },

  function setProperty<T>(target: AnyObject, propertyName: string, value: T): void {
    const [newTarget, newPropertyName] = navigateToProperty(target, propertyName, () => ({ value: {}, shouldContinue: true }));
    if (newTarget == null) { throw new Error('This error should not occur, it means something went wrong within navigateToProperty'); }
    if (newTarget[newPropertyName] === undefined) {
      Reflect.defineProperty(newTarget, newPropertyName, { value, writable: true, configurable: true, enumerable: false });
    } else if (Reflect.checkPropertyAccess(newTarget, newPropertyName, PropertyAccess.CanWrite)) {
      newTarget[newPropertyName] = value;
    } else {
      throw new InternalError('Unable to set property value because the property does not permit write access.', { meta: { target: newTarget, property: newPropertyName } });
    }
  },

  function checkPropertyAccess(target: AnyObject, propertyName: string, access: PropertyAccess): boolean {
    const [newTarget, newPropertyName] = navigateToProperty(target, propertyName);
    if (newTarget === null) { throw new InternalError('Access was requested on a property that does not exist.', { meta: { target, propertyName, access } }); }
    const definition = Reflect.getDefinition(newTarget, newPropertyName);
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

  function getAllPrototypesOf(target: object | Function): Object[] {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let prototype: any = undefined;
    const prototypes = new Array<unknown>();
    if (is.prototype(target)) prototype = target.prototype;
    else if (is.instance(target)) prototype = Reflect.getPrototypeOf(target);
    else if (is.object(target)) prototype = target;
    if (prototype == null) return [];
    prototypes.push(prototype);
    while ((prototype = Reflect.getPrototypeOf(prototype)) !== Object.prototype) prototypes.push(prototype);
    return prototypes.cast<Object>();
  },

  function invoke(target: object, name: string, ...args: unknown[]): unknown {
    if (typeof (target) !== 'object' || target == null) throw new Error('Invalid target for invocation.');
    let obj: AnyObject = target;
    let func: Function | undefined;
    name.split('.').forEach((propertyName, index, array) => {
      func = obj[propertyName];
      if (typeof (func) === 'object' && func != null && index < array.length - 1) obj = func;
    });
    if (typeof (func) !== 'function') throw new Error(`Unable to find "${name}" on the object provided.`);
    return func.apply(obj, args);
  },

  function invokeAll(target: object, name: string, ...args: unknown[]): unknown[] {
    return Reflect.getAllPrototypesOf(target)
      .map(prototype => {
        const methodDescriptor = Reflect.getOwnPropertyDescriptor(prototype, name);
        if (methodDescriptor == null || !is.function(methodDescriptor.value)) return;
        return methodDescriptor.value;
      })
      .removeNull()
      .map(method => method.apply(target, args));
  },

  function getAndCombineAll<T extends {}>(target: object, propertyName: string): T {
    const results = Reflect.getAllPrototypesOf(target)
      .map(prototype => {
        const propertyDescriptor = Reflect.getOwnPropertyDescriptor(prototype, propertyName);
        if (propertyDescriptor == null || !is.function(propertyDescriptor.get)) return;
        return propertyDescriptor.get;
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

  function wrapMethod(target: object, method: Function, delegate: (originalMethod: Function, args: unknown[]) => unknown): void {
    Object.defineProperty(target, method.name, {
      value(...args: unknown[]) {
        args.unshift(method.bind(target));
        return delegate.apply(target, args as never);
      },
      configurable: true,
      enumerable: false,
      writable: false,
    });
  },

  function hashesOf(target: unknown): string[] {
    return Reflect.getAllPrototypesOf(target)
      .map(prototype => Object.hash(prototype))
      .removeByFilter(hash => hash === '' || hash == null)
      .distinct();
  },

  function areDeepEqual(source: unknown, target: unknown): boolean {
    return is.deepEqual(source, target);
  },

  function areShallowEqual(source: unknown, target: unknown): boolean {
    return is.shallowEqual(source, target);
  },

  function walk(target: object | Function, onProperty: (property: Reflect.WalkerProperty) => void | false): void {
    const walkFunc = (innerTarget: unknown, parent: Reflect.WalkerProperty | undefined, arrayIndex?: number) => {
      if (innerTarget instanceof DateTime) return;
      if (innerTarget instanceof Date) return;
      Object.entries(Reflect.getAllDefinitions(innerTarget))
        .forEach(([name, descriptor], index) => {
          const property: Reflect.WalkerProperty = {
            name,
            descriptor,
            propertyIndex: index,
            parent,
            get path() {
              if (parent == null) return [name];
              return parent.path.concat([arrayIndex, name].removeNull());
            },
            get: () => {
              if (Reflect.has(descriptor, 'get')) return Reflect.get(innerTarget as object, name);
              if (Reflect.has(descriptor, 'value')) return descriptor.value;
            },
            set: (value: unknown) => {
              if (Reflect.has(descriptor, 'set') || descriptor.writable) Reflect.set(innerTarget as object, name, value);
            },
            rename: (newName: string) => {
              Reflect.deleteProperty(innerTarget as object, name);
              Reflect.defineProperty(innerTarget as object, newName, descriptor);
              name = newName;
            }
          };
          const result = onProperty(property);
          if (result === false) return;
          const value = property.get();
          if (is.array(value)) value.forEach((item, itemIndex) => walkFunc(item, property, itemIndex));
          if (is.plainObject(value)) walkFunc(value, property);
        });
    };
    walkFunc(target, undefined);
  },

  function getByPath<T = unknown>(target: object, propertyKey: string): { wasFound: boolean, value: T; } {
    if (typeof (propertyKey) === 'string') {
      const keys = propertyKey.split(/\.|\[|\]/).filter(v => v.length > 0);
      if (keys.length > 1) {
        const firstKey = keys.shift();
        if (firstKey != null) {
          const { wasFound, value } = getByPath(target, firstKey);
          if (wasFound) {
            if (is.plainObject(value) || is.array(value))
              // it doesn't matter that the keys only get rejoined here as . in between because JS still treats an index as a property, i.e.
              // mydata[0].something === mydata.0.something
              return getByPath(value, keys.join('.'));
          }
        }
        return { wasFound: false, value: undefined as unknown as T };
      }
    }
    if (!Reflect.has(target, propertyKey)) return { wasFound: false, value: undefined as unknown as T };
    return { wasFound: true, value: Reflect.get(target, propertyKey) };
  },

  function setByPath<T = unknown>(target: object, propertyKey: string, value: T, createPathIfNotExists = true): boolean {
    if (typeof (propertyKey) === 'string') {
      const keys = propertyKey.split(/(\.|\[|\])/).filter(v => v.length > 0);
      if (keys.length > 1) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const firstKey = keys.shift()!;
        const separator = keys.shift();
        const isArray = separator === '[';
        let index = 0;
        if (isArray) {
          let indexAsString = '';
          do { indexAsString += keys.shift(); } while (!indexAsString.includes(']') && keys.length > 0);
          index = parseInt(indexAsString.substr(0, indexAsString.length - 1));
          keys.shift(); // remove the .
        }
        let { wasFound, value: innerValue } = Reflect.getByPath(target, firstKey);
        if (innerValue == null) wasFound = false;
        if (wasFound) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (isArray && is.array<any>(innerValue)) {
            if (innerValue.length <= index) {
              if (!createPathIfNotExists) return false;
              innerValue.length = index + 1;
            }
            if (keys.length === 0) {
              innerValue[index] = value;
              return true;
            }
            if (innerValue[index] == null) innerValue[index] = {};
            return setByPath(innerValue[index], keys.join(''), value, createPathIfNotExists);
          }
          return setByPath(innerValue as object, keys.join(''), value, createPathIfNotExists);
        } else {
          if (!createPathIfNotExists) return false;
          if (isArray) {
            const array = new Array(index + 1);
            Reflect.set(target, firstKey, array);
            if (keys.length === 0) {
              array[index] = value;
              return true;
            } else {
              array[index] = {};
              return setByPath(array[index], keys.join(''), value, createPathIfNotExists);
            }
          }
          const subObject = {};
          Reflect.set(target, firstKey, subObject);
          return setByPath(subObject, keys.join(''), createPathIfNotExists);
        }
      }
    }
    return Reflect.set(target, propertyKey, value);
  },

]);
