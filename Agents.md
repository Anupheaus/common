# @anupheaus/common — Agent Guide

This document describes the **@anupheaus/common** library for AI agents and developers. It is a TypeScript utility and data-structure library that provides extensions, errors, events, collections, proxy utilities, and more.

---

## Overview

- **Package:** `@anupheaus/common`
- **Repository:** https://github.com/Anupheaus/common
- **License:** Apache-2.0
- **Runtime:** Node.js and browser (where applicable). Some modules (e.g. `createSettings`) assume a Node environment.

The library is built with TypeScript, exports from `./dist/index.js` with typings at `dist/index`, and is organized into focused modules under `src/`.

---

## Main Modules and Exports

### Extensions (`src/extensions`)

Type guards, conversions, and prototype extensions used across the library and by consumers.

- **`is`** — Type guards and checks: `is.null`, `is.function`, `is.array`, `is.promise`, `is.guid`, `is.production`, `is.equal` (with options), and many others. Use `is.not.*` for negated checks.
- **`to`** — Coercion and formatting: `to.string`, `to.number`, `to.boolean`, `to.date`, `to.type`, plus serialisation/deserialisation and diff helpers.
- **`currency`** — Currency-related helpers (exported from extensions).
- **`ListItem`** — List item utilities.
- **Prototype extensions** (imported for side effects): `object`, `array`, `date`, `function`, `math`, `promise`, `reflect`, `string`, `map`, `set`, `weakMap` — add methods to built-in types (e.g. `Array`, `Object`, `Date`, `Map`).
- **`global`** — Shared types and globals (e.g. `AnyObject`, `AnyFunction`, `Record`, `PromiseMaybe`).

**When to use:** Use `is` for safe type checks and defaults, `to` for parsing/formatting and serialisation; be aware that prototype extensions augment built-ins globally.

---

### Errors (`src/errors`)

Structured error classes extending a common base, with optional metadata and status codes.

- **`Error`** (BaseError) — Base error with `message`, `title`, `meta`, `statusCode`, and serialisation support.
- **`InternalError`**, **`ArgumentInvalidError`**, **`NotImplementedError`**, **`ValidationError`**, **`AuthenticationError`**, **`ObjectDisposedError`**, **`ApiError`**, **`ServerError`** — Domain-specific subclasses.

**When to use:** Throw these instead of raw `Error` when you need consistent error handling, status codes, or serialisation (e.g. over APIs).

---

### Events (`src/events`)

Typed pub/sub and async event handling.

- **`Event`** — Create events with `Event.create<T>()`, subscribe with `.subscribe()`, raise with `Event.raise()`. Supports single-result and array-result modes, optional “raise previous events to new subscribers,” and ordering via `orderIndex`.
- **`Unsubscribe`** — Function returned from subscribe to remove the handler.

**When to use:** Decouple components with typed events; use for lifecycle hooks, notifications, or async workflows.

---

### Models (`src/models`)

Shared value objects and types for sorting, geometry, data APIs, and dates.

- **`sort`** — Sort direction and related types.
- **`array`** — Array diff, merge, order-by, sync options, map delegates (see `src/models/array`).
- **`geometry`** — Coordinates, dimensions, location, size, and geometry types.
- **`data`** — Data layer models: filters, pagination, request/response, sorts (e.g. for APIs or tables).
- **`date`** — Date and time models (uses Luxon where relevant).

**When to use:** Use these types in APIs, UI state, or shared logic to keep contracts consistent.

---

### Decorators (`src/decorators`)

- **`@bind`** — Binds method to instance so `this` is correct when passed as a callback.
- **`@throttle(timeout | props)`** — Caches method return value for a duration; optional `ignoreArguments` to throttle by call only.

**When to use:** Use `@bind` on methods used as event handlers or callbacks; use `@throttle` for expensive or repeated calls.

---

### Cancellation (`src/cancellationToken`)

- **`CancellationToken`** — Create with `CancellationToken.create()`, call `cancel(reason?)`, and register with `onCancelled(callback)`. Exposes `isCancelled` and `reason`.
- **`CancellationCallback`** and related types from `models`.

**When to use:** Cancel async workflows, cleanup on unmount, or abort long-running operations.

---

### Settings (`src/settings`)

- **`createSettings(delegate)`** — Builds a settings object from a function that receives a `from` helper. `from.env(key)` reads from `process.env` with optional `defaultValue`, `isRequired`, and `transform`. `from.preset.mode` is `'production' | 'development'` from `NODE_ENV`.

**When to use:** Centralise environment-based config in Node apps. Not for browser-only code.

---

### Wrappers (`src/wrappers`)

- **`repeatOnError(delegate, config)`** — Retries `delegate` on failure. Config: `maxAttempts` or `onAttempt`, `onSuccess`, `onFailure`. Supports sync and promise-returning delegates.

**When to use:** Transient failure retry (e.g. network or DB) with custom back-off or logging via `onAttempt`/`onFailure`.

---

### Utils (`src/utils`)

- **`chain`** — Chain operations (e.g. optional pipeline).
- **`memoize`** — Memoize function results.
- **`debounce`** — Debounce function calls.

**When to use:** Performance (memoize, debounce) or fluent APIs (chain).

---

### Proxy (`src/proxy`)

Proxies for observable or lazy object graphs.

- **`createProxyOf(target)`** — Creates a proxy of an object; supports `get`, `set`, `onGet`, `onSet`, `onAfterSet`, `onDefault`, and “is set” checks per path.
- **`getProxyApiFrom(proxy)`** — Gets the proxy API (value, isSet, onSet, set) for a given path.
- **`traverse`** — Traverse proxy paths.
- **`ProxyOf`, `ProxyApi`, and related types** from `publicModels`.

**When to use:** When you need change detection, defaults, or lazy access on nested objects without touching every property manually.

---

### Subscriptions (`src/subscriptions`)

- **`createSubscriber<TFunc>()`** — Returns `{ subscribe(callback): Unsubscribe, invoke(...args) }`. Invoke calls all subscribed callbacks with the same arguments.

**When to use:** Simple pub/sub where you don’t need full Event semantics (ordering, previous events, etc.).

---

### Records (`src/Records`)

- **`Records<T extends Record>`** — Collection of entities with `id`. Methods: `add`, `remove`, `update`, `clear`, reorder; `get(id)`, `toArray()`, `ids()`, `indexOf`; `onModified` (and filtered variants) with reasons: `'add' | 'remove' | 'update' | 'clear' | 'reorder'`.

**When to use:** In-memory store of domain entities keyed by id, with change notifications.

---

### Collection (`src/Collection`)

- **`Collection<T>`** — Set-like collection with `add`, `remove`, `clear`, `has`, `get`/`toArray`, and `onModified` / `onAdded` / `onRemoved` / `onCleared`.

**When to use:** Unique items with add/remove/clear and optional observers; no id requirement.

---

### ArrayModifications (`src/ArrayModifications`)

- **`ArrayModifications<RecordType>`** — Tracks added/updated/removed records (by id). Events: `onAdded`, `onUpdated`, `onRemoved`, `onCleared`, `onModified`; guard events: `onCanAdd`, `onCanUpdate`, `onCanRemove`. `applyTo(array, options)` produces a new array with modifications applied. Exports **`ArrayModificationsModels`** and **`SerialisedArrayModifications`**.

**When to use:** Deltas for list UIs or sync (e.g. offline queues, batch updates).

---

### DoubleMap (`src/DoubleMap`)

- **`DoubleMap<K1, K2, V>`** — Two-key map: `get(key1, key2)`, `set(key1, key2, value)`, `delete`, `clear`, `keys()`, `values()`, `clone`. Uses array extensions (e.g. `sum`, `mapMany`) internally.

**When to use:** Lookups by two keys (e.g. row + column, source + target).

---

### Auditor (`src/auditor`)

- **Audit types and APIs** — Create audited objects with history (created/updated/restored/branched). Replay history to reconstruct or rollback state. Uses Luxon for timestamps and integrates with diff/apply (e.g. just-diff/just-diff-apply). Exports **`auditor-models`** for types.

**When to use:** When you need an audit log or time-travel over object state.

---

### Logger (`src/logger`)

- **`Logger`** — Levelled logging (silly, trace, debug, info, warn, error, fatal) with optional timestamps, colours, and meta. Supports listeners and services.
- **`LoggerEntry`**, **`LoggerService`** — Listener and service interfaces for custom sinks or formatting.

**When to use:** Structured app logging with levels and pluggable outputs.

---

## Entry Points

- **Main:** Import from `@anupheaus/common` (or from built `dist/index.js`). The root index re-exports the modules above.
- **Extensions:** Import `'./extensions'` (or the package path) for side-effect registration of prototype extensions; then use `is`, `to`, and extended built-ins.

---

## Dependencies (notable)

- **luxon** — Dates and timestamps (auditor, logger, extensions).
- **fast-equals** — Deep equality (e.g. `is.equal`).
- **object-hash** — Hashing for throttle/debounce keys.
- **just-diff** / **just-diff-apply** — Diffs and patch application (auditor, to).
- **numeral** — Number formatting in `to`.
- **inflection** — Pluralisation/singularisation in `to`.
- **uuid** — UUID generation where used.
- **chalk** — Terminal colours (logger).
- **dotenv** — Env loading where used.

---

## Conventions

- **Record:** Entities with at least an `id` (string) are typed as `Record` in extensions; used by Records, ArrayModifications, and auditor.
- **Unsubscribe:** Many subscribe methods return an `Unsubscribe` function (from events) to remove the listener.
- **PromiseMaybe<T>:** Type for values that may be sync or Promise (used in events and extensions).

---

## Quick Reference by Task

| Task                         | Module / export to use              |
|-----------------------------|--------------------------------------|
| Type checks / defaults      | `is`, `is.not` from extensions       |
| Parse/format/serialise      | `to` from extensions                  |
| Throw structured errors     | `errors` (e.g. `ValidationError`)     |
| Pub/sub events              | `Event` or `createSubscriber`        |
| Cancel async work           | `CancellationToken`                  |
| Retry on failure            | `repeatOnError`                      |
| Bind method to `this`       | `@bind` decorator                    |
| Throttle method calls       | `@throttle` decorator                |
| Memoize / debounce          | `utils`: `memoize`, `debounce`       |
| Observable/lazy objects     | `createProxyOf`, `getProxyApiFrom`   |
| Id-based record collection  | `Records`                            |
| Unique item collection      | `Collection`                         |
| Two-key map                 | `DoubleMap`                          |
| Track add/update/remove     | `ArrayModifications`                 |
| Audit log / history         | `auditor`                            |
| Env-based config (Node)     | `createSettings`                     |
| Levelled logging           | `logger`                             |
| Shared API/data types       | `models` (data, geometry, sort, etc.)|

---

This file is the single source of truth for agents and developers exploring **@anupheaus/common**. For implementation details, refer to the TypeScript sources and tests under `src/` and `tests/`.
