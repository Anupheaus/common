export interface IMap<T= any> {
  [key: string]: T;
}

export interface IRecord {
  id: string;
}

export type ConstructorOf<T = {}> = new (...args: any[]) => T;

// tslint:disable-next-line:callable-types
export type TypeOf<T> = { new(...args: any[]): T; } | ((...args: any[]) => T) | Function; // Function & { prototype: T };

export type Diff<T extends string | number | symbol, U extends string | number | symbol> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export type Minus<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] };

type UpsertableObject<T extends IRecord, TKey extends keyof T = keyof T> = (Pick<T, TKey> | Partial<T>) & IRecord;
type IfElsePrimitive<T, U> = T extends string | number | boolean ? T : U;
export type Updatable<T, TKey extends keyof T = keyof T> = IfElsePrimitive<T, UpsertableObject<T & IRecord, TKey>>;
export type Upsertable<T, TKey extends keyof T = keyof T> = IfElsePrimitive<T, Updatable<T, TKey>>;
export type EnsureId<T> = T extends IRecord ? T : never;

export type PromiseMaybe<T = void> = T | Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
  ? DeepPartial<U>[]
  // tslint:disable-next-line:no-shadowed-variable
  : T[P] extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : DeepPartial<T[P]>
};

export interface IDisposable {
  dispose(): void;
}
