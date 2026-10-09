# Extensions: is, to and prototype extensions

> What the is and to helpers cover, which prototype extensions the package installs, and their gotchas.
>
> Status: accepted · Version 1

`is` and `to` are singletons, and importing the package root registers prototype extensions on `Array`, `Object`, `Date`, `Map`, `Set`, `String`, `Promise`, `Function`, `Math`, `Reflect` and `WeakMap`.

- `is` — type-narrowing checks (`is.string`, `is.guid`, `is.class`, `is.equal`, `is.production`, …), with negatives under `is.not`.
- `to` — conversion between types, plus `serialise`/`deserialise` and `diff`.
- Prototype extensions add `array.findById`, `array.groupBy`, `Object.merge`, `date.format` and similar. They are global once imported, intentional, and inherited by everything that depends on this package.
- The same module exports `currency`, `ListItem`/`ListItems`, and the shared types in `global.ts` (`AnyObject`, `AnyFunction`, `PromiseMaybe`, `Record`, `MapOf`, `ConstructorOf`, `ErrorLike`, `PrimitiveType`, `NotPromise`).

## Gotchas

- `is.function` is `false` for classes; use `is.class`.
- `is.production` reads `process.env.NODE_ENV` and is Node-only.
- `to.string` treats a number second argument as a format string, not a default value.
