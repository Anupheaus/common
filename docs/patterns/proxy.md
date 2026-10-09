# Observable proxies (createProxyOf)

> Wrap nested objects in createProxyOf to observe reads and writes and track which paths were explicitly set.
>
> Status: accepted · Version 1

`createProxyOf(target)` returns `{ proxy, get, onGet, isSet, set, onSet, onAfterSet, onDefault }`. Reading an unset sub-path returns another proxy, so nested objects work without declaring a schema, and sub-path proxies are cached so `proxy.a` is referentially stable.

- `onGet` fires on every read; `event.value` is mutable.
- `onSet` fires before a write, and `event.preventDefault()` blocks the write entirely, including `onAfterSet`.
- `onDefault` fires only for a path with no set value and may supply a value for that read; the value is not persisted. Use `set` when it should stick.
- `isSet` is tracked in its own map, so `undefined` can be an explicitly set value, distinct from never set.
- `getProxyApiFrom(proxy)` returns `{ value, isSet, onSet, set }` for a path on an existing proxy, or `undefined` if it is not one.
- `traverse` resolves values along a path without firing callbacks — never use it for observation.

Use it for change detection and lazy defaults on nested objects; `to` uses it internally.
