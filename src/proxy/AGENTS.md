# proxy

Observable proxy wrappers that intercept get/set/default on any object, tracking which paths have been explicitly set.

## Overview

This module provides `createProxyOf`, which wraps any object in a recursive `Proxy` and returns an API for intercepting reads, writes, and "default" access (reading an unset path). It is used by `to.ts` internally and is available for consumers that need change detection or lazy-default patterns on nested objects.

`createDynamicProxy` is an internal convenience wrapper around `createProxyOf` — it is **not exported** from the module index.

## Contents

### Public API
- `createProxyOf<T>(target)` — Creates a proxy of `target`. Returns `{ proxy, get, onGet, isSet, set, onSet, onAfterSet, onDefault }`. The `proxy` mirrors `T`'s shape as `ProxyOf<T>`, with every property access returning another proxy for the sub-path.
- `getProxyApiFrom<T>(target)` — Given a `ProxyOf<T>`, returns its `ProxyApi<T>` (`{ value, isSet, onSet, set }`). Returns `undefined` if `target` is not a proxy. Used to inspect or subscribe to a specific path on a proxy.
- `traverse(target, path, options?)` — Low-level path traversal utility. Walks `target` along `path`, calling `onEmptyProperty` when a node is missing and optionally setting defaults.

### Public types (`publicModels.ts`)
- `ProxyOf<T>` — Recursive mapped type where every property is also a `ProxyOf`.
- `ProxyApi<T>` — `{ value: T; isSet: boolean; onSet(callback, props?): void; set(newValue: T): void }`.
- `OnGetEvent`, `OnGetCallback` — Fired when a path is read. `event.value` is mutable.
- `OnSetEvent`, `OnSetCallback` — Fired before a set. Can call `event.preventDefault()` to block the set.
- `OnAfterSetEvent`, `OnAfterSetCallback` — Fired after a successful set.
- `OnDefaultEvent`, `OnDefaultCallback` — Fired when a path is read but has no set value. `event.value` can be set to provide a default; `event.traversedPath` is the path walked so far, `event.remainingPath` is what is left.

### Internal files (not exported)
- `createDynamicProxy.ts` — Convenience wrapper: creates a `createProxyOf({})` with all four callbacks pre-wired with `{ includeSubProperties: true }`. Not in the module index.
- `privateModels.ts` — `isProxySymbol` and `getProxyApiSymbol` — Symbols used to detect and unwrap proxies. Imported by `is.ts` to power `is.proxy`.
- `internalApi.ts` — Internal storage layer (value map, isSet map, listener registries).
- `get.ts`, `set.ts`, `isSet.ts`, `onDefault.ts` — Individual operation implementations.
- `proxyUtils.ts` — Path key normalisation (`convertToCorrectPropertyType`).

## Architecture

Every `createProxyOf` call creates an isolated `InternalApi` that holds the actual values and listener sets keyed by path. The `Proxy` object itself is stateless — it delegates all operations to the `InternalApi` via the `fullApi` closure.

Sub-path access (e.g. `proxy.a.b.c`) returns nested `Proxy` objects cached in an `internalCache` `Map` on each proxy node. This means repeated access to the same sub-path returns the same proxy object (referentially stable).

`getProxyApiFrom` works by reading a well-known `Symbol` property (`getProxyApiSymbol`) from the proxy's `get` trap — this is how the proxy exposes its API without polluting the object's apparent shape.

## Decision rationale

`onDefault` exists separately from `onGet` because its contract is different: `onGet` is called for every read (including set paths), while `onDefault` is called only when the path has no value and allows the callback to synthesise one lazily. Conflating them would force every `onGet` handler to check `isSet` itself.

`isSet` tracking is explicit (a separate boolean map) rather than using sentinel values so that `undefined` is a valid explicitly-set value, distinct from "never set."

## Ambiguities and gotchas

- **`ProxyOf<T>` shape is a lie at runtime**: the proxy accepts any property access and returns another proxy — TypeScript's type narrows it, but at runtime you can go arbitrarily deep on any path.
- **`onDefault` vs `onGet`**: `onDefault` fires only for unset paths. Setting `event.value` in `onDefault` does **not** persist the value to the proxy — it is provided only for the current read. Use `set` on the path if you want the value to persist.
- **`preventDefault()` in `onSet`**: blocks the set entirely, including `onAfterSet`. The `newValue` is discarded.
- **Sub-path proxy stability**: accessing `proxy.a` twice returns the same proxy object. But accessing `proxy.a.b` and then `proxy.a` followed by `.b` also returns the same proxy (because `proxy.a` is cached and its `internalCache` holds `b`).
- **`traverse` is low-level**: it does not fire `onGet`/`onSet` callbacks. It is for direct value resolution, not observation.

## Related

- [`../extensions/AGENTS.md`](../extensions/AGENTS.md) — `is.ts` imports `isProxySymbol` from this module; `to.ts` uses `createProxyOf` internally
