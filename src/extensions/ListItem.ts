import type { F } from 'ts-toolbelt';

export interface ListItem {
  id: string;
  text: string;
  ordinal?: number;
  isDisabled?: boolean;
}

export namespace ListItems {
  interface CreateListItems<T extends readonly ListItem[]> { ids: T[number]['id'], pairs: T; }

  export function create<T extends ListItem[]>(pairs: F.Narrow<T>): CreateListItems<T>;
  export function create<T extends ListItem[]>(pairs: F.Narrow<T>) {
    return {
      ids: pairs.map(pair => pair.id),
      pairs,
    };
  }

  export function as<B extends ListItem>(): { create<T extends B[]>(items: F.Narrow<T>): CreateListItems<T>; } {
    return { create };
  }
}

// const { ids, pairs } = ListItems.create([
//   { id: '1', text: 'One' },
//   { id: '2', text: 'Two' },
//   { id: '3', text: 'Three' },
// ]);