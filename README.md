[![Publish Package](https://github.com/Anupheaus/common/actions/workflows/publish.yml/badge.svg)](https://github.com/Anupheaus/common/actions/workflows/publish.yml)

# @anupheaus/common

Shared utilities and extensions for TypeScript/JavaScript. A general-purpose library for type guards, collections, events, logging, and more.

## Install

Published to GitHub Packages. Add to your `.npmrc`:

```
@anupheaus:registry=https://npm.pkg.github.com
```

Then authenticate (e.g. `npm login --registry=https://npm.pkg.github.com` with a GitHub PAT, or set `NODE_AUTH_TOKEN` in CI).

```bash
pnpm add @anupheaus/common
```

## What it does

### Extensions & type utilities
- **`is`** — Type guards (`is.null`, `is.array`, `is.promise`, `is.guid`, etc.) with `is.not.*` for negated checks
- **`to`** — Coercion and formatting (`to.string`, `to.number`, `to.boolean`, `to.date`, serialisation)
- **`currency`** — Currency helpers
- Prototype extensions for `Array`, `Object`, `Date`, `Map`, `Set`, `String`, `Promise`, and more (e.g. `array.findById`, `object.merge`)

### Errors & validation
- Structured error classes: `ValidationError`, `AuthenticationError`, `ApiError`, `ServerError`, etc.
- Base error with `meta`, `statusCode`, and serialisation for APIs

### Events & subscriptions
- **`Event`** — Typed pub/sub with `Event.create()`, `Event.raise()`, ordering, and async support
- **`createSubscriber()`** — Simple subscribe/invoke pattern

### Collections & data
- **`Records<T>`** — Id-based collection with add/remove/update/reorder and `onModified` callbacks
- **`Collection<T>`** — Set-like collection with `onAdded`/`onRemoved`/`onCleared`
- **`ArrayModifications<RecordType>`** — Track add/update/remove deltas and apply to arrays
- **`DoubleMap<K1, K2, V>`** — Two-key map

### Async & utilities
- **`CancellationToken`** — Cancel async operations
- **`repeatOnError()`** — Retry with configurable back-off
- **`memoize`**, **`debounce`** — Performance helpers
- **`@bind`**, **`@throttle`** — Method decorators

### Proxy & audit
- **`createProxyOf()`** — Observable proxy with `onGet`, `onSet`, `onDefault`, and “is set” checks
- **`auditor`** — Audit logging with history, restore, and branch support

### Logging & config
- **`Logger`** — Levelled logging (silly, trace, debug, info, warn, error, fatal, **always**) with timestamps and meta
- **`createSettings()`** — Environment-based config from `process.env` (Node)

### Models
- Shared types for data APIs (filters, pagination, sorts), geometry (coordinates, dimensions), and date ranges

---

For detailed module documentation, see [Agents.md](./Agents.md).
