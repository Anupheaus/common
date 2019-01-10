export interface IMap<T= any> {
  [key: string]: T;
}

export interface IRecord {
  id: string;
}

export type ConstructorOf<T = {}> = new (...args: any[]) => T;

// tslint:disable-next-line:callable-types
export type TypeOf<T> = { new(...args: any[]): T; } | ((...args: any[]) => T) | Function; // Function & { prototype: T };

type Diff<T extends string | number | symbol, U extends string | number | symbol> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];

export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

export type Minus<T, U> = { [P in Diff<keyof T, keyof U>]: T[P] };

export type Upsert<T extends IRecord, TKey extends keyof T = keyof T> = (Pick<T, TKey> | Partial<T>) & IRecord;

export type EnsureId<T> = T extends IRecord ? T : never;

export type PromiseMaybe<T> = T | Promise<T>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
  ? DeepPartial<U>[]
  // tslint:disable-next-line:no-shadowed-variable
  : T[P] extends ReadonlyArray<infer U>
  ? ReadonlyArray<DeepPartial<U>>
  : DeepPartial<T[P]>
};
