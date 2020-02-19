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
  [key: string]: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction<ReturnType = any> = (...args: any[]) => ReturnType;

export interface IRecord {
  id: string;
}

export type ConstructorOf<T = {}> = new (...args: any[]) => T;

// tslint:disable-next-line:callable-types
export type TypeOf<T> = { new(...args: any[]): T } | ((...args: any[]) => T) | Function; // Function & { prototype: T };

export type Diff<T extends string | number | symbol, U extends string | number | symbol> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export type Minus<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] };

type UpsertableObject<T extends IRecord, TKey extends keyof T = keyof T> = (Pick<T, TKey> | Partial<T>) & IRecord;
type IfElsePrimitiveType<T, U> = T extends PrimitiveType ? T : U;
export type Updatable<T extends IRecord, TKey extends keyof T = keyof T> = UpsertableObject<T & IRecord, TKey>;
export type Upsertable<T extends IRecord | PrimitiveType, TKey extends keyof T = keyof T> = IfElsePrimitiveType<T, UpsertableObject<T & IRecord, TKey>>;
export type EnsureId<T> = T extends IRecord ? T : never;
export type PrimitiveType = string | number | boolean;
export type PrimitiveOrObjectType = PrimitiveType | AnyObject;
export type PrimitiveOrRecordType = PrimitiveType | IRecord;
export type IsPrimitiveType<T> = T extends PrimitiveType ? T : never;
export type IsPrimitiveOrObjectType<T> = T extends PrimitiveOrObjectType ? T : never;
export type IsPrimitiveOrRecordType<T> = T extends PrimitiveOrRecordType ? T : never;

export type PromiseMaybe<T = void> = T | Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer U)[] ? readonly DeepPartial<U>[] : DeepPartial<T[P]>
};

export interface IDisposable {
  dispose(): void;
}
