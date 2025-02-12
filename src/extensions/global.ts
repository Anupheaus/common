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
export type AnyAsyncFunction<ReturnType = any> = (...args: any[]) => Promise<ReturnType>;


export interface Record {
  id: string;
}

export type ConstructorOf<T = {}> = new (...args: any[]) => T;

// helpers
type IfAny<T, Y, N> = 0 extends (1 & T) ? Y : N;
type IsUnknown<T> = unknown extends T ? IfAny<T, never, true> : never;
/* eslint-disable @typescript-eslint/indent */
type UnknownReplacer<T, K> = K extends [infer WithThis, ...infer WithRest]
  ? T extends [infer ReplaceThis, ...infer ReplaceRest]
  ? IsUnknown<ReplaceThis> extends never
  ? [ReplaceThis, ...UnknownReplacer<ReplaceRest, K>]
  : [WithThis, ...UnknownReplacer<ReplaceRest, WithRest>]
  : []
  : T;
/* eslint-enable @typescript-eslint/indent */


/**
  * @summary GenericConstructorParameters takes two type arguments:
  * - T is a constructor
  * - K is a tuple of types (one type for each generic in the constructor)
  */
export type GenericConstructorParameters<T extends abstract new (...args: any) => any, K> = UnknownReplacer<ConstructorParameters<T>, K>;

// tslint:disable-next-line:callable-types
export type TypeOf<T> = { new(...args: any[]): T; } | ((...args: any[]) => T) | Function; // Function & { prototype: T };

export type Diff<T extends string | number | symbol, U extends string | number | symbol> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never; })[T];

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export type Minus<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] };

type UpsertableObject<T extends Record, TKey extends keyof T = keyof T> = (Pick<T, TKey> | Partial<T>);
// type IfElsePrimitiveType<T, U> = T extends PrimitiveType ? T : U;
export type UpdatableRecord<T extends Record, TKey extends keyof T = keyof T> = UpsertableObject<T & Record, TKey>;
export type NewRecord<T extends Record> = Omit<T, 'id'> & { id?: string; };
export type UpsertableRecord<T extends Record> = UpdatableRecord<T> | NewRecord<T>; // T | (Omit<T, keyof Record> & Partial<Record>);
export type Upsertable<T> = T | (T extends Record ? UpsertableRecord<T> : T);
export type EnsureId<T> = T extends Record ? T : never;
export type PrimitiveType = string | number | boolean;
export type PrimitiveOrObjectType = PrimitiveType | AnyObject;
export type PrimitiveOrRecordType = PrimitiveType | Record;
export type IsPrimitiveType<T> = T extends PrimitiveType ? T : never;
export type IsPrimitiveOrObjectType<T> = T extends PrimitiveOrObjectType ? T : never;
export type IsPrimitiveOrRecordType<T> = T extends PrimitiveOrRecordType ? T : never;
export type NonNullableOrVoid<T> = NonNullable<Exclude<T, void>>;

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
export type UnPromise<T> = T extends Promise<infer P> ? P : T;
export type NotPromise<T> = UnPromise<T>;

export type BaseType = string | number | object | boolean | Function;
export type IsBaseType<T> = T extends BaseType ? true : false;

export type MixinBaseType = new (...args: any[]) => any;
type GetProps<TBase> = TBase extends new (props: infer P) => any ? P : never;
type GetInstance<TBase> = TBase extends new (...args: any[]) => infer I ? I : never;
type EmptyConstructor<A, B> = new () => GetInstance<A> & GetInstance<B>;
type NonEmptyConstructor<A, B> = new (props: GetProps<A> & GetProps<B>) => GetInstance<A> & GetInstance<B>;
// eslint-disable-next-line @typescript-eslint/no-shadow
export type MergeMixinConstructor<MixinType, MixinBaseType> = MixinType extends new () => any
  ? MixinBaseType extends new () => any ? EmptyConstructor<MixinType, MixinBaseType> : NonEmptyConstructor<MixinType, MixinBaseType> : NonEmptyConstructor<MixinType, MixinBaseType>;

export interface ErrorLike {
  message: string;
  stack?: string;
  name?: string;
}

export type Selectable<T> = { isSelected: boolean; item: T; };
