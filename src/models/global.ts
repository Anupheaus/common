export interface IdTextPair {
  id: string;
  text: string;
}

export namespace IdTextPair {
  interface CreateIdTextPairs<T extends readonly IdTextPair[]> { ids: T[number]['id'], pairs: T; }

  export function create<T extends readonly IdTextPair[]>(pairs: T): CreateIdTextPairs<T>;
  export function create<T extends readonly IdTextPair[]>(pairs: T) {
    return {
      ids: pairs.map(pair => pair.id),
      pairs,
    };
  }

  export function as<B extends IdTextPair>(): { create<T extends readonly B[]>(items: T): CreateIdTextPairs<T>; } {
    return { create };
  }
}
