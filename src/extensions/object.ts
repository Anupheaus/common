import { IRecord } from './global';
import { is } from './is';

interface IDisposable {
  dispose(): void;
}

/*type Diff<T extends string, U extends string> = (
  & {[P in T]: P }
  & {[P in U]: never }
  & { [x: string]: never }
)[T];

type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;*/

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
    clone<T>(target: T): T;
    diff(target: object, comparison: object): object;
    hash(target: object): number;
    remove<T, P>(value: T, removeProps: (propsToRemove: T) => P): P;
    // remove2<T, K extends Partial<T>>(value: T, removeProps: K): Pick<T, Diff<keyof T, keyof K>>;
    values<T= any>(target: object): T[];
    getValueOf<R>(delegate: () => R, defaultValue: R): R;
    getValueOf<T, R>(target: T, delegate: (target: T) => R, defaultValue: R): R;
    createNamedFunction(name: string, body: (...args: any[]) => any): Function;
    mixin(destinationClass: Function, sourceClass: Function): void;
    using<T extends IDisposable, R>(object: T, use: (object: T) => R): R;
  }

}

if (!Object.addMethods) {
  Object.defineProperty(Object, 'addMethods', {
    value: function addMethods(this: Object, target: object, methods: Function[]): void {
      methods.forEach(method => {
        const methodName = method.name;
        if (typeof (target[methodName]) === 'function' && target[methodName].toString() === method.toString()) { return; }
        try {
          Object.defineProperty(target, methodName, {
            value: method,
            enumerable: false,
            configurable: true,
            writable: true,
          });
        } catch (error) {
          // tslint:disable-next-line:no-console
          console.error('An error has occurred trying to add the following method to the following target.', {
            target: target.constructor.name,
            method: methodName,
            currentMethod: target[methodName].toString(),
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

function isOverridableItemArray<T>(items: T[]): items is (T & IRecord)[] {
  return items.every((item: any) => !is.null(item) && is.stringAndNotEmpty(item.id));
}

function parseObject<T>(existingObject: T, newObject: T, checkForOverridableItems: boolean): T {
  existingObject = existingObject || {} as T;
  // tslint:disable-next-line:forin
  for (const key in newObject) {
    existingObject[key] = parseValue(existingObject[key], newObject[key], checkForOverridableItems);
  }
  return existingObject;
}

function parseArray(existingValue: any[], newValue: any[], checkForOverridableItems: boolean): any[] {
  if (!(existingValue instanceof Array)) { existingValue = new Array<any>(); }
  if (existingValue.length === 0 && newValue.length === 0) { return existingValue; }
  // Check to see if the items are overridable
  if (checkForOverridableItems && isOverridableItemArray(existingValue) && isOverridableItemArray(newValue)) {
    existingValue.syncWith(newValue);
  } else {
    if (existingValue.length > newValue.length) { existingValue.length = newValue.length; }
    newValue.forEach((item, index) => { existingValue[index] = parseValue(existingValue[index], item, checkForOverridableItems); });
  }
  return existingValue;
}

function parseValue(existingValue: any, newValue: any, checkForOverridableItems: boolean): any {
  if (newValue === undefined || existingValue === newValue) { return existingValue; }
  if (is.date(newValue)) {
    return newValue;
  } else if (is.plainObject(newValue)) {
    return parseObject(existingValue, newValue, checkForOverridableItems);
  } else if (is.array(newValue)) {
    return parseArray(existingValue, newValue, checkForOverridableItems);
  } else {
    return newValue;
  }
}

Object.addMethods(Object, [

  function extendPrototype(this: Object, targetPrototype: object, extensionPrototype: object): void {
    const extensionMethods = Object
      .getOwnPropertyNames(extensionPrototype)
      .filter(method => method !== 'constructor')
      .map(method => extensionPrototype[method]);
    Object.addMethods(targetPrototype, extensionMethods);
  },

  function merge<T>(this: Object, target: T, ...extenders: any[]): T {
    extenders.removeNull().forEach(extender => target = parseValue(target, extender, false));
    return target;
  },

  function clone<T>(this: Object, target: T): T {
    if (target == null) { return target; }
    if (target instanceof Array) {
      return Object.merge([], target) as T;
    } else {
      return Object.merge({}, target) as T;
    }
  },

  function diff(this: Object, target: object, comparison: object): object {

    const compareObject = (targetObject: any, comparisonObject: any): object => {
      const changes = {};
      let hasChanged = false;
      const keys = Reflect.ownKeys(targetObject)
        .concat(Reflect.ownKeys(comparisonObject))
        .reduce((list, key) => list.includes(key) ? list : list.concat([key]), new Array<PropertyKey>());
      // tslint:disable-next-line:forin
      for (const key of keys) {
        const result = compareValue(targetObject[key], comparisonObject[key]);
        if (result === undefined) { continue; }
        changes[key] = result;
        hasChanged = true;
      }
      if (!hasChanged) { return undefined; }
      return changes;
    };

    const compareArray = (targetArray: any[], comparisonArray: any[]): any[] => {
      if (targetArray.length === comparisonArray.length && JSON.stringify(targetArray) === JSON.stringify(comparisonArray)) { return undefined; }
      comparisonArray.forEach((item, index) => {
        if (!item) { return; }
        if (!is.stringAndNotEmpty(item.id)) { return; }
        const existingItem = targetArray.find(i => i && i.id === item.id);
        if (!existingItem) { return; }
        const result = compareObject(existingItem, item) || {} as any;
        result.id = item.id;
        comparisonArray[index] = result;
      });
      return comparisonArray;
    };

    const compareValue = (targetValue: any, comparisonValue: any): any => {
      if (targetValue === comparisonValue) { return undefined; }
      if (is.null(targetValue) && !is.null(comparisonValue)) { return comparisonValue; }
      if (!is.null(targetValue) && is.null(comparisonValue)) { return undefined; }
      if (typeof (targetValue) !== typeof (comparisonValue)) { return comparisonValue; }
      if (is.plainObject(targetValue)) {
        return compareObject(targetValue, comparisonValue);
      } else if (is.array(targetValue)) {
        return compareArray(targetValue, comparisonValue);
      } else {
        return comparisonValue;
      }
    };

    return compareValue(target, comparison);
  },

  function hash(this: Object, target: object): number {
    if (is.null(target)) { return 0; }
    const hashableValues: string[] = [];
    if (target && typeof (target) === 'object' && typeof (target.constructor) === 'function') {
      const isPrototype = Object.getOwnPropertyNames(target).includes('constructor');
      if (isPrototype) {
        target = target.constructor;
      } else {
        if (target.constructor.name === 'Object') {
          hashableValues.push(JSON.stringify(target));
        } else {
          hashableValues.push(`InstanceOf_${target.constructor.name}`);
        }
      }
    }
    Reflect.getAllPrototypesOf(target)
      .forEach(value => hashableValues.push(typeof (value.constructor) === 'function' ? value.constructor.toString() : value.toString()));
    return hashableValues.join('|').hash();
  },

  function remove<T, P>(this: Object, target: T, delegate: (target: T) => P): P {
    return delegate(target);
  },

  function getValueOf<T, R>(this: Object, targetOrDelegate: any, delegateOrDefaultValue: R | ((target: T) => R), defaultValue?: R): R {
    let target = targetOrDelegate;
    let delegate = delegateOrDefaultValue as ((target: T) => R);
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
    return value != null ? value : defaultValue;
  },

  function createNamedFunction(name: string, body: (...args: any[]) => any): Function {
    return {
      [name](...args: any[]) {
        return body.apply(this, args);
      },
    }[name];
  },

  function mixin(destinationClass: Function, sourceClass: Function): void {
    Object.getOwnPropertyNames(sourceClass.prototype).forEach(name => destinationClass.prototype[name] = sourceClass.prototype[name]);
  },

  function using<T extends IDisposable, R = any>(object: T, use: (object: T) => R): R {
    let result: R;
    try {
      result = use(object);
    } finally {
      object.dispose();
    }
    return result;
  },

]);

if (!Object.values) {
  Object.addMethods(Object, [

    function values(this: Object, target: Object): any[] {
      return Object.keys(target).map(name => target[name]);
    },

  ]);
}
