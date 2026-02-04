import type { Record, Disposable, AnyObject } from './global';
import { hash as utilsHash } from './utils';
import { is } from './is';
import { v4 as uuid } from 'uuid';
import type { } from './array';
import { DateTime } from 'luxon';

type HashOptions = Parameters<typeof utilsHash>[1];

const stringifyUniqueObjectId = Symbol('stringifyUniqueObjectId');

// tslint:disable-next-line:no-namespace
declare global {

  // tslint:disable-next-line:interface-name
  interface ObjectConstructor {
    addMethods(target: object, methods: Function[]): void;
    extendPrototype(targetPrototype: object, extensionPrototype: object): void;
    /**
     * Overwrites the values in target with the values in the extensions.  It will overwrite giving priority to the last extension, i.e. if the first extension
     * overwrites property A, and the second extension also has a value for property A, it will take priority and apply it's value rather than the first extension.
     */
    merge<T1, T2>(target: T1, extension: T2): T1 & T2;
    /**
     * Overwrites the values in target with the values in the extensions.  It will overwrite giving priority to the last extension, i.e. if the first extension
     * overwrites property A, and the second extension also has a value for property A, it will take priority and apply it's value rather than the first extension.
     */
    merge<T1, T2, T3>(target: T1, extension1: T2, extension2: T3): T1 & T2 & T3;
    /**
     * Overwrites the values in target with the values in the extensions.  It will overwrite giving priority to the last extension, i.e. if the first extension
     * overwrites property A, and the second extension also has a value for property A, it will take priority and apply it's value rather than the first extension.
     */
    merge<T1, T2, T3, T4>(target: T1, extension1: T2, extension2: T3, extension3: T4): T1 & T2 & T3 & T4;
    /**
     * Overwrites the values in target with the values in the extensions.  It will overwrite giving priority to the last extension, i.e. if the first extension
     * overwrites property A, and the second extension also has a value for property A, it will take priority and apply it's value rather than the first extension.
     */
    merge<T>(target: Partial<T>, ...extensions: Partial<T>[]): T;
    // extend<T1, T2>(target: T1, extension: T2): T1 & T2;
    // extend<T1, T2, T3>(target: T1, extension1: T2, extension2: T3): T1 & T2 & T3;
    // extend<T1, T2, T3, T4>(target: T1, extension1: T2, extension2: T3, extension3: T4): T1 & T2 & T3 & T4;
    // extend<T>(target: T, ...extensions: T[]): T;
    clone<T>(target: T, replacer?: (value: unknown) => unknown): T;
    // diff(target: object, comparison: object): object;
    hash(target: object, options?: HashOptions): string;
    remove<T, P>(value: T, removeProps: (propsToRemove: T) => P): P;
    // remove2<T, K extends Partial<T>>(value: T, removeProps: K): Pick<T, Diff<keyof T, keyof K>>;
    values<T = unknown>(target: object): T[];
    getValueOf<R>(delegate: () => R, defaultValue: R): R;
    getValueOf<T, R>(target: T, delegate: (target: T) => R, defaultValue: R): R;
    mixin(destinationClass: Function, sourceClass: Function): void;
    using<T extends Disposable, R>(object: T, use: (object: T) => R): R;
    stringify(target: object, replacer?: (key: string, value: unknown) => unknown, space?: string | number): string;
  }

}

if (!Object.addMethods) {
  Object.defineProperty(Object, 'addMethods', {
    value: function addMethods(this: Object, target: AnyObject, methods: Function[]): void {
      methods.forEach(method => {
        const methodName = method.name;
        const existingMethod = target[methodName] as Function | undefined;
        if (is.function(existingMethod) && existingMethod.toString() === method.toString()) { return; }
        try {
          Object.defineProperty(target, methodName, {
            value: method,
            enumerable: false,
            configurable: true,
            writable: true,
          });
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('An error has occurred trying to add the following method to the following target.', {
            target: target.constructor.name,
            method: methodName,
            currentMethod: existingMethod?.toString() ?? '<Undefined>',
            newMethod: method.toString(),
          });
        }
      });
    },
    enumerable: false,
    configurable: true,
    writable: false,
  });
}

function isOverridableItemArray<T>(items: T[]): items is (T & Record)[] {
  return items.cast<T & Record>().every(item => item != null && typeof (item) === 'object' && item.id != null);
}

function parseObject<T extends object>(existingObject: T, newObject: T, checkForOverridableItems: boolean, replacer: (value: unknown) => unknown): T {
  if (newObject === undefined) return existingObject;
  Reflect.ownKeys(newObject).forEach(key => {
    let { get: existingGet, value: existingValue } = Object.getOwnPropertyDescriptor(existingObject, key) ?? {};
    existingValue = existingGet ? existingGet.call(existingObject) : (typeof (existingValue) !== 'function' ? existingValue : undefined);
    const { get: newGet, set: newSet, value: newValue, ...otherProps } = Object.getOwnPropertyDescriptor(newObject, key) ?? {};
    const get = newGet ? () => {
      return newGet.call(existingObject);
    } : undefined;
    const set = newSet ? (...args: any[]) => newSet.call(existingObject, args) : undefined;
    const value = newValue !== undefined ? (typeof (newValue) === 'function' ? (...args: any[]) => newValue.apply(existingObject, args) :
      parseValue(existingValue, newValue, checkForOverridableItems, replacer)) : undefined;
    Object.defineProperty(existingObject, key, {
      ...otherProps,
      ...(get ? { get } : {}),
      ...(set ? { set } : {}),
      ...(value !== undefined ? { value } : {}),
    });
  });
  return existingObject;
}

function parseArray(existingValue: unknown[], newValue: unknown[], checkForOverridableItems: boolean, replacer: (value: unknown) => unknown): unknown[] {
  if (!(existingValue instanceof Array)) { existingValue = []; }
  if (existingValue.length === 0 && newValue.length === 0) { return existingValue; }
  // Check to see if the items are overridable
  if (checkForOverridableItems && isOverridableItemArray(existingValue) && isOverridableItemArray(newValue)) {
    return existingValue.syncWith(newValue, {
      createBy: b => parseValue(undefined, b, true, replacer) as Record,
      updateMatched: (a, b) => parseValue(Object.clone(a), b, true, replacer) as Record
    });
  }
  const changedArray = existingValue.slice();
  let hasChangedArray = false;
  if (existingValue.length > newValue.length) {
    changedArray.length = newValue.length;
    hasChangedArray = true;
  }
  newValue.forEach((item, index) => {
    const result = parseValue(existingValue[index], item, checkForOverridableItems, replacer);
    if (result === existingValue[index]) { return; }
    hasChangedArray = true;
    changedArray[index] = result;
  });
  return hasChangedArray ? changedArray : existingValue;
}

function parseValue(existingValue: unknown, newValue: unknown, checkForOverridableItems: boolean, replacer: (value: unknown) => unknown): unknown {
  newValue = replacer(newValue);
  if (newValue === undefined || existingValue === newValue) { return existingValue; }
  if (is.date(newValue)) {
    return newValue;
  } else if (DateTime.isDateTime(newValue)) {
    return newValue;
  } else if (is.plainObject(newValue)) {
    if (existingValue == null) { existingValue = {}; }
    return parseObject(existingValue as object, newValue, checkForOverridableItems, replacer);
  } else if (is.array(newValue)) {
    if (existingValue == null) { existingValue = []; }
    return parseArray(existingValue as [], newValue, checkForOverridableItems, replacer);
  } else {
    return newValue;
  }
}

Object.addMethods(Object, [

  function extendPrototype(this: Object, targetPrototype: object, extensionPrototype: AnyObject): void {
    const map: PropertyDescriptorMap = {};
    Object.entries<PropertyDescriptor>(Object.getOwnPropertyDescriptors(extensionPrototype)).forEach(([name, descriptor]) => {
      if (name === 'constructor' || typeof (descriptor.value) !== 'function') return;
      map[name] = descriptor;
    });
    Object.defineProperties(targetPrototype, map);
  },

  function merge<T>(this: Object, target: T, ...extenders: unknown[]): T {
    extenders.removeNull().forEach(extender => target = parseValue(target, extender, true, (v => v)) as T);
    return target;
  },

  function clone<T>(this: Object, target: T, replacer?: (value: unknown) => unknown): T {
    // if (replacer == null) return structuredClone(target);
    if (target == null) { return target; }
    if (target instanceof Array) {
      const newTarget = [] as T;
      return parseValue(newTarget, target, true, replacer ?? (v => v)) as T;
    } else {
      const newTarget = {} as T;
      return parseValue(newTarget, target, true, replacer ?? (v => v)) as T;
    }
  },

  // function diff(this: Object, target: object, comparison: object): object {

  //   const compareObject = (targetObject: AnyObject, comparisonObject: AnyObject): AnyObject | undefined => {
  //     const changes: AnyObject = {};
  //     let hasChanged = false;
  //     const keys = Reflect.ownKeys(targetObject)
  //       .concat(Reflect.ownKeys(comparisonObject))
  //       .reduce((list, key) => list.includes(key) ? list : list.concat([key]), new Array<PropertyKey>());
  //     // tslint:disable-next-line:forin
  //     for (const key of keys) {
  //       // eslint-disable-next-line @typescript-eslint/no-use-before-define
  //       const result = compareValue(targetObject[key as string], comparisonObject[key as string]);
  //       if (result === undefined) { continue; }
  //       changes[key as string] = result;
  //       hasChanged = true;
  //     }
  //     if (!hasChanged) { return; }
  //     return changes;
  //   };    

  //   const compareArray = (targetArray: unknown[], comparisonArray: unknown[]): unknown[] | undefined => {
  //     if (targetArray.length === comparisonArray.length && JSON.stringify(targetArray) === JSON.stringify(comparisonArray)) { return; }
  //     comparisonArray.forEach((item, index) => {
  //       if (item == null) { return; }
  //       if (!is.object<AnyObject>(item) || is.empty(item.id)) { return; }
  //       const existingItem = targetArray.find(i => is.object<AnyObject>(i) && i.id === item.id);
  //       if (!existingItem) { return; }
  //       const result = compareObject(existingItem, item) || {} as any;
  //       result.id = item.id;
  //       comparisonArray[index] = result;
  //     });
  //     return comparisonArray;
  //   };

  //   const compareValue = (targetValue: any, comparisonValue: any): any => {
  //     if (targetValue === comparisonValue) { return undefined; }
  //     if (is.null(targetValue) && !is.null(comparisonValue)) { return comparisonValue; }
  //     if (!is.null(targetValue) && is.null(comparisonValue)) { return undefined; }
  //     if (typeof (targetValue) !== typeof (comparisonValue)) { return comparisonValue; }
  //     if (is.plainObject(targetValue)) {
  //       return compareObject(targetValue, comparisonValue);
  //     } else if (is.array(targetValue)) {
  //       return compareArray(targetValue, comparisonValue);
  //     } else {
  //       return comparisonValue;
  //     }
  //   };

  //   return compareValue(target, comparison);
  // },

  function hash(this: Object, target: object, options?: HashOptions): string {
    return utilsHash(target, options);
    // const hashableValues: string[] = [];
    // if (target && typeof (target) === 'object' && typeof (target.constructor) === 'function') {
    //   const isPrototype = is.prototype(target);
    //   if (isPrototype) {
    //     target = target.constructor;
    //   } else {
    //     if (target.constructor.name === 'Object') {
    //       hashableValues.push(JSON.stringify(target));
    //     } else {
    //       hashableValues.push(`InstanceOf_${target.constructor.name}`);
    //     }
    //   }
    // }
    // Reflect.getAllPrototypesOf(target)
    //   .forEach(value => hashableValues.push(typeof (value.constructor) === 'function' ? value.constructor.toString() : value.toString()));
    // return utilsHash(hashableValues.join('|'));
  },

  function remove<T, P>(this: Object, target: T, delegate: (target: T) => P): P {
    return delegate(target);
  },

  function getValueOf<T, R>(this: AnyObject, targetOrDelegate: T | (() => R), delegateOrDefaultValue: R | ((target: T) => R), defaultValue?: R): R | undefined {
    let target = targetOrDelegate as T | undefined;
    let delegate = delegateOrDefaultValue as ((target?: T) => R);
    if (is.function(targetOrDelegate)) {
      target = undefined;
      delegate = targetOrDelegate;
      defaultValue = delegateOrDefaultValue as R;
    }
    let value;
    try {
      value = delegate(target);
    } catch (error) {
      if (error instanceof TypeError) { return defaultValue; }
      throw error;
    }
    return value ?? defaultValue;
  },

  function mixin(destinationClass: Function, sourceClass: Function): void {
    Object.getOwnPropertyNames(sourceClass.prototype).forEach(name => destinationClass.prototype[name] = sourceClass.prototype[name]);
  },

  function using<T extends Disposable, R = unknown>(object: T, use: (object: T) => R): R {
    let result: R;
    try {
      result = use(object);
    } finally {
      object.dispose();
    }
    return result;
  },

  function stringify(target: object, replacer?: (key: string, value: unknown) => unknown, space?: string | number): string {
    const existingObjects = new Map<object, string>();
    const providedReplacer = replacer ?? ((_innerKey, value) => value);
    return JSON.stringify(target, (key, value: unknown) => {
      value = providedReplacer(key, value);
      if (is.function(value)) return value.toString();
      if (!is.object(value) && !is.plainObject(value)) return value;
      if (is.function(value.toJSON)) return value.toJSON();
      if (existingObjects.has(value)) return { [stringifyUniqueObjectId]: existingObjects.get(value) };
      const id = uuid();
      (value as any)[stringifyUniqueObjectId] = id;
      existingObjects.set(value, id);
      return value;
    }, space);
  },

]);

if (!Object.values) {
  Object.addMethods(Object, [

    function values(this: Object, target: AnyObject): unknown[] {
      return Object.keys(target).map(name => target[name]);
    },

  ]);
}
