# @anupheaus/common — Agent Guide

A TypeScript utility and data-structure library providing extensions, errors, events, collections, proxy utilities, and more.

---

## Overview

- **Package:** `@anupheaus/common`
- **Repository:** https://github.com/Anupheaus/common
- **Registry:** GitHub Packages (`@anupheaus:registry=https://npm.pkg.github.com`)
- **License:** Apache-2.0
- **Runtime:** Node.js and browser (where applicable). `createSettings` and file-based logger output assume a Node environment.

The library is built with TypeScript, exports from `./dist/index.js` with typings at `dist/index`, and is organised into focused modules under `src/`. Test files follow `*.tests.ts`; run with `pnpm run test-ci`.

---

## Main Modules

### Complex modules — see their own AGENTS.md

- **[`src/extensions/`](./src/extensions/AGENTS.md)** — `is`, `to`, `currency`, `ListItem`, global types, and prototype extensions for all built-in types. Importing from the package root triggers all side effects.
- **[`src/errors/`](./src/errors/AGENTS.md)** — Typed, serialisable error classes with status codes and round-trip deserialisation. NOTE: the base class is exported as `Error` — it shadows `globalThis.Error`.
- **[`src/events/`](./src/events/AGENTS.md)** — `Event`: typed pub/sub with three execution modes (concurrent, in-turn, passthrough) and optional replay to late subscribers.
- **[`src/models/`](./src/models/AGENTS.md)** — Shared value types for data APIs (filters, pagination, sorts), geometry, arrays, and dates. The common contract between UI, API, and data layers.
- **[`src/proxy/`](./src/proxy/AGENTS.md)** — `createProxyOf`: observable proxy with intercept hooks for get, set, after-set, and default. Includes `isSet` tracking and `getProxyApiFrom` for inspecting a path on an existing proxy.
- **[`src/logger/`](./src/logger/AGENTS.md)** — Levelled logger (silly–always) with sub-loggers, batching listeners, and remote sinks (Grafana Loki, New Relic).
- **[`src/auditor/`](./src/auditor/AGENTS.md)** — Append-only audit log with diff/apply history and time-travel reconstruction over entity state.

### Simpler modules — documented here

**Decorators (`src/decorators/`)**
- `@bind` — Binds a method to its instance; use on methods passed as callbacks to avoid losing `this`.
- `@throttle(timeout | props)` — Caches a method's return value for a duration. `props.ignoreArguments` caches by call only (not by argument values). Useful for expensive computed properties.

**Cancellation (`src/cancellationToken/`)**
- `CancellationToken` — Create with `CancellationToken.create()`. Call `.cancel(reason?)` to cancel; register with `.onCancelled(callback)`; check `.isCancelled` and `.reason`. Use to abort async workflows or cleanup on unmount.

**Settings (`src/settings/`)**
- `createSettings(delegate)` — Builds a settings object from `process.env`. `from.env(key, options?)` reads environment variables with optional default, required check, and transform. `from.preset.mode` returns `'production' | 'development'` from `NODE_ENV`. **Node-only.**

**Wrappers (`src/wrappers/`)**
- `repeatOnError(delegate, config)` — Retries `delegate` on failure. Config accepts `maxAttempts` (number) or `onAttempt` (callback returning whether to continue), plus `onSuccess` and `onFailure`. Supports sync and async delegates.

**Utils (`src/utils/`)**
- `chain` — Fluent optional-pipeline helper.
- `memoize` — Memoises a function by its arguments.
- `debounce` — Debounces a function call.
- `captureConsole` — Redirects `console.*` calls to a callback; Node-only utility used in tests.

**Subscriptions (`src/subscriptions/`)**
- `createSubscriber<TFunc>()` — Returns `{ subscribe(callback): Unsubscribe, invoke(...args) }`. Simpler than `Event` when you don't need ordering, modes, or previous-event replay. Prefer `Event` for complex lifecycles.

**Records (`src/Records/`)**
- `Records<T extends Record>` — In-memory store of id-keyed entities. Methods: `add`, `remove`, `update`, `clear`, `reorder`, `get(id)`, `toArray()`, `ids()`, `indexOf`. Fires `onModified` (and filtered variants) with reason: `'add' | 'remove' | 'update' | 'clear' | 'reorder'`.

**Collection (`src/Collection/`)**
- `Collection<T>` — Set-like collection (no id requirement). Methods: `add`, `remove`, `clear`, `has`, `get`/`toArray`, `onModified`/`onAdded`/`onRemoved`/`onCleared`.

**ArrayModifications (`src/ArrayModifications/`)**
- `ArrayModifications<RecordType>` — Tracks add/update/remove deltas for a record set. Guard events (`onCanAdd`, `onCanUpdate`, `onCanRemove`) let listeners veto changes. `applyTo(array, options)` produces a new array with all modifications applied. Exports `ArrayModificationsModels` and `SerialisedArrayModifications` for persistence.

**DoubleMap (`src/DoubleMap/`)**
- `DoubleMap<K1, K2, V>` — Two-key map: `get(k1, k2)`, `set(k1, k2, value)`, `delete`, `clear`, `keys()`, `values()`, `clone`. Use for row+column or source+target lookups.

---

## Entry Points

- **Main:** Import from `@anupheaus/common`. The root `index.ts` imports all extensions for side effects, then re-exports everything.
- **Selective imports:** Importing from `src/extensions/is` directly does **not** trigger prototype extensions. Always import from the package root in production code.

---

## Dependencies (notable)

| Dependency | Used by |
|-----------|---------|
| `luxon` | auditor (timestamps), logger, extensions (date) |
| `fast-equals` | `is.equal` |
| `object-hash` | `@throttle` key hashing |
| `just-diff` / `just-diff-apply` | auditor, `to.diff` |
| `numeral` | `to.string` (number formatting) |
| `inflection` | `to.plural` / `to.singular` |
| `uuid` | internal ID generation |

---

## Conventions

- **`Record`**: entities with at least an `id: string` field. Used by `Records`, `ArrayModifications`, and `auditor`.
- **`Unsubscribe`**: a `() => void` returned by any subscribe call. Store and call to remove the listener.
- **`PromiseMaybe<T>`**: `T | Promise<T>` — used in events and extensions for functions that may or may not be async.

---

## Decision rationale

- **`Event` vs `createSubscriber`**: `Event` is the full-featured primitive (modes, ordering, previous-event replay, disposal). `createSubscriber` is a lightweight alternative for simple broadcast with no lifecycle requirements.
- **Prototype extensions**: chosen for ergonomics (`array.findById(id)` > `findById(array, id)`). The trade-off is global prototype mutation, which is intentional. Libraries depending on this package inherit the extensions.
- **Error serialisation via `@error` marker**: avoids colliding with common `type` fields in API payloads and is visually distinct when inspecting serialised data.

---

## Ambiguities and gotchas

- **`import { Error }` shadows `globalThis.Error`**: any file that imports `Error` from this package loses the built-in. Use `import { Error as CommonError }` or `globalThis.Error` explicitly.
- **Prototype extensions in browsers**: extensions like `Array.prototype.findById` are safe in most browser contexts, but can conflict with third-party libraries that also extend built-ins. Test for conflicts when integrating.
- **`createSettings` is Node-only**: it reads `process.env` directly. Do not use in browser builds.
- **`is.production` is Node-only**: reads `process.env.NODE_ENV`. Returns `false` if `process` is not defined.

---

## Quick Reference

| Task | Export |
|-----------------------------|--------------------------------------|
| Type checks / defaults | `is`, `is.not` |
| Parse/format/serialise | `to` |
| Throw structured errors | errors module (e.g. `ValidationError`) |
| Pub/sub events | `Event` or `createSubscriber` |
| Cancel async work | `CancellationToken` |
| Retry on failure | `repeatOnError` |
| Bind method to `this` | `@bind` |
| Throttle method calls | `@throttle` |
| Memoize / debounce | `memoize`, `debounce` |
| Observable/lazy objects | `createProxyOf`, `getProxyApiFrom` |
| Id-based record collection | `Records` |
| Unique item collection | `Collection` |
| Two-key map | `DoubleMap` |
| Track add/update/remove | `ArrayModifications` |
| Audit log / time-travel | auditor module |
| Env-based config (Node) | `createSettings` |
| Levelled logging | `Logger` |
| Always-show log message | `logger.always()` |
| Shared API/data types | models module |

---

## Related

- [`src/extensions/AGENTS.md`](./src/extensions/AGENTS.md) — type guards, coercion, prototype extensions
- [`src/errors/AGENTS.md`](./src/errors/AGENTS.md) — structured error classes
- [`src/events/AGENTS.md`](./src/events/AGENTS.md) — typed pub/sub
- [`src/models/AGENTS.md`](./src/models/AGENTS.md) — shared data/geometry/sort types
- [`src/proxy/AGENTS.md`](./src/proxy/AGENTS.md) — observable proxies
- [`src/logger/AGENTS.md`](./src/logger/AGENTS.md) — levelled logger
- [`src/auditor/AGENTS.md`](./src/auditor/AGENTS.md) — audit history
