# extensions

Type guards, coercion helpers, and prototype extensions that augment JavaScript built-ins globally.

## Overview

This module is the foundation of the library. It exports the `is` and `to` utility singletons, `currency`, `ListItem`, and shared global types. It also registers prototype extensions on `Array`, `Object`, `Date`, `Map`, `Set`, `String`, `Promise`, `Function`, `Math`, `Reflect`, and `WeakMap` as side effects. Most other modules in this library depend on these extensions being registered.

Importing from `@anupheaus/common` (the package root) automatically triggers all side effects. Importing a specific file such as `import { is } from '@anupheaus/common/src/extensions/is'` does **not** register side effects — do not do this in production code unless you specifically want to avoid them.

## Contents

### Type guards and checks
- `is` — Singleton with type-narrowing checks: `is.null`, `is.string`, `is.number`, `is.boolean`, `is.array`, `is.promise`, `is.guid`, `is.function`, `is.class`, `is.object`, `is.equal`, `is.production`, and more. Use `is.not.*` for negated variants.

### Coercion and formatting
- `to` — Singleton for converting values between types: `to.string`, `to.number`, `to.boolean`, `to.date`, `to.type`. Also provides `serialise`/`deserialise` and `diff` (JSON patch). See [`to/AGENTS.md`](./to/AGENTS.md) for full detail.

### Domain helpers
- `currency` — Currency formatting and parsing helpers.
- `ListItem` / `ListItems` — Typed key-value list items used by `DataFiltersModels` and other modules.

### Shared types (`global.ts`)
- `AnyObject`, `AnyFunction`, `PromiseMaybe`, `Record`, `MapOf`, `ConstructorOf`, `ErrorLike`, `PrimitiveType`, `NotPromise` — foundational types used across the library.

### Side-effect prototype extensions (imported for side effects only, not re-exported)
These files add methods to built-in types and are imported in `index.ts` for their side effects:
- `array.ts` — adds `findById`, `mapById`, `groupBy`, `sum`, `mapMany`, `last`, etc. to `Array`
- `object.ts` — adds `merge`, `clone`, and other helpers to `Object`
- `date.ts` — adds `format` and comparison helpers to `Date`
- `function.ts`, `math.ts`, `promise.ts`, `reflect.ts`, `string.ts`, `map.ts`, `set.ts`, `weakMap.ts` — extend their respective built-in types

## Decision rationale

Prototype extensions were chosen over standalone utility functions for ergonomics — `array.findById(id)` reads more naturally than `findById(array, id)`. The trade-off is a modified global prototype, which is intentional and documented.

The `is` and `to` helpers are class instances (singletons) rather than plain modules so that `is.not` can be a mirrored proxy of `is`, and so that `to` can carry internal state (e.g. registered parsers) cleanly.

## Ambiguities and gotchas

- **`is.function` vs `is.class`**: `is.function` returns `false` for class constructors. Use `is.class` to detect classes. This is non-obvious because `typeof MyClass === 'function'` is true.
- **`is.production`**: reads from `process.env.NODE_ENV` — not suitable in browser-only code where `process` may not exist.
- **Prototype extensions are global**: once imported, they affect all code in the process. Libraries that depend on this package get the extensions too, whether they want them or not.
- **`is.equal` options**: accepts an `IsEqualOptions` second argument for controlling deep vs shallow comparison — the overloads are easy to miss.
- **`to.string` overloads**: when passed a `number` as second argument, it is treated as a format string, not a default value. The overload ordering is tricky.

## Related

- [`to/AGENTS.md`](./to/AGENTS.md) — serialisation, diff, and the full `to` implementation
- [`../proxy/AGENTS.md`](../proxy/AGENTS.md) — `is.ts` imports `isProxySymbol` from proxy; `to.ts` uses `createProxyOf` internally
- [`../errors/AGENTS.md`](../errors/AGENTS.md) — `to.ts` uses `Error` and `InternalError` internally
