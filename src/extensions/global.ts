/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * @deprecated Deprecated in favour of MapOf or AnyObject.
 */
export interface IMap<T = any> {
  [key: string]: T;
}

export interface MapOf<T> {
  [key: string]: T;
}

export interface AnyObject {
  [key: string]: any;
}

export type AnyFunction<ReturnType = any> = (...args: any[]) => ReturnType;

export interface Record {
  id: string;
}

export type ConstructorOf<T = {}> = new (...args: any[]) => T;

// tslint:disable-next-line:callable-types
export type TypeOf<T> = { new(...args: any[]): T; } | ((...args: any[]) => T) | Function; // Function & { prototype: T };

export type Diff<T extends string | number | symbol, U extends string | number | symbol> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never; })[T];

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export type Minus<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] };

type UpsertableObject<T extends Record, TKey extends keyof T = keyof T> = (Pick<T, TKey> | Partial<T>) & Record;
type IfElsePrimitiveType<T, U> = T extends PrimitiveType ? T : U;
export type Updatable<T extends Record, TKey extends keyof T = keyof T> = UpsertableObject<T & Record, TKey>;
export type Upsertable<T extends Record | PrimitiveType, TKey extends keyof T = keyof T> = IfElsePrimitiveType<T, UpsertableObject<T & Record, TKey>>;
export type EnsureId<T> = T extends Record ? T : never;
export type PrimitiveType = string | number | boolean;
export type PrimitiveOrObjectType = PrimitiveType | AnyObject;
export type PrimitiveOrRecordType = PrimitiveType | Record;
export type IsPrimitiveType<T> = T extends PrimitiveType ? T : never;
export type IsPrimitiveOrObjectType<T> = T extends PrimitiveOrObjectType ? T : never;
export type IsPrimitiveOrRecordType<T> = T extends PrimitiveOrRecordType ? T : never;

export type PromiseMaybe<T = void> = T | Promise<T>;
export type VoidPromise = Promise<void>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer U)[] ? readonly DeepPartial<U>[] : DeepPartial<T[P]>
};

export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends (infer U)[] ? DeepRequired<U>[] : T[P] extends readonly (infer U)[] ? readonly DeepRequired<U>[] : DeepRequired<T[P]>
};

export interface Disposable {
  dispose(): void;
}

export type MakePromise<T> = T extends Promise<infer P> ? Promise<P> : Promise<T>;
export type NotPromise<T> = T extends Promise<infer P> ? P : T;

export type SoundType = string | number | object | boolean | Function;
export type IsSoundType<T> = T extends SoundType ? true : false;