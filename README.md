[![CI](https://github.com/Anupheaus/common/actions/workflows/publish.yml/badge.svg)](https://github.com/Anupheaus/common/actions/workflows/publish.yml)
[![Coverage](https://codecov.io/gh/Anupheaus/common/branch/master/graph/badge.svg)](https://codecov.io/gh/Anupheaus/common)
[![Version](https://img.shields.io/github/v/tag/Anupheaus/common?label=version)](https://github.com/Anupheaus/common/releases)
[![License](https://img.shields.io/github/license/Anupheaus)](LICENSE.md)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org)

# @anupheaus/common

Shared utilities and extensions for TypeScript/JavaScript. A general-purpose library for type guards, collections, events, logging, and more.

## What problem it solves

Every TypeScript project ends up reimplementing the same primitives: safe type checks, error serialisation, typed pub/sub, collection management, retry logic, and structured logging. This library provides those primitives in a consistent, tested form so they don't have to be re-invented per project.

## Tech stack

- **Language:** TypeScript 5.x
- **Runtime:** Node.js (primary) and browser (most modules)
- **Key dependencies:** `luxon` (dates), `fast-equals` (deep equality), `just-diff`/`just-diff-apply` (JSON patch), `numeral` (number formatting), `inflection` (pluralisation), `uuid`
- **Test runner:** Mocha + Chai via `pnpm run test-ci`
- **Build:** Webpack + `ts-loader`

## Installation / Setup

Published to GitHub Packages. Add to your `.npmrc`:

```
@anupheaus:registry=https://npm.pkg.github.com
```

Authenticate with a GitHub PAT (scope: `read:packages`), or set `NODE_AUTH_TOKEN` in CI:

```bash
pnpm add @anupheaus/common
```

## Usage

```ts
import { is, to, Event, Logger, ValidationError, Records, CancellationToken } from '@anupheaus/common';

// Type guards
if (is.string(value)) { ... }
if (is.not.null(value)) { ... }

// Coercion
const n = to.number(req.query.limit, 10);

// Typed events
const onChange = Event.create<(newValue: string) => void>();
const unsubscribe = onChange(value => console.log(value));
Event.raise(onChange, 'hello');

// Structured errors
throw new ValidationError('Must be positive', 'amount');

// Logging
const logger = new Logger('MyApp');
logger.info('started', { port: 3000 });
```

## Architecture

All source is under `src/`, one directory per module. See [AGENTS.md](./AGENTS.md) for the full module map and quick-reference table. Key sub-modules with their own detailed docs:

- [src/extensions/AGENTS.md](./src/extensions/AGENTS.md) — type guards, coercion, prototype extensions
- [src/errors/AGENTS.md](./src/errors/AGENTS.md) — structured error classes
- [src/events/AGENTS.md](./src/events/AGENTS.md) — typed pub/sub with three execution modes
- [src/models/AGENTS.md](./src/models/AGENTS.md) — shared data/geometry/sort types
- [src/proxy/AGENTS.md](./src/proxy/AGENTS.md) — observable proxies
- [src/logger/AGENTS.md](./src/logger/AGENTS.md) — levelled logger with remote sinks
- [src/auditor/AGENTS.md](./src/auditor/AGENTS.md) — audit history and time-travel

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `undefined` | Set to `'production'` to make `is.production()` return `true`. Read by `createSettings` via `from.preset.mode`. |

No other environment variables are used by this library directly. `createSettings` reads arbitrary variables that the calling app defines.

## Known limitations and non-goals

- **`createSettings` is Node-only**: it reads `process.env` directly and will throw in browser builds.
- **Prototype extensions are global**: importing this package mutates `Array.prototype`, `Object`, `Date.prototype`, etc. This is intentional but can conflict with third-party libraries that also extend built-ins.
- **`is.production` is Node-only**: reads `process.env.NODE_ENV`; not safe in browser environments where `process` may not be defined.
- **No reactive state management**: this library provides events and collections but is not a React/Vue state solution. Use `react-ui` for React-specific patterns.
- **No HTTP client**: `ApiError` and `DataRequest`/`DataResponse` describe the shape of HTTP interactions but this library does not make HTTP calls.

## Errors and what they mean

All errors extend `BaseError` and serialise to `{ "@error": "ClassName", ... }`.

| Error class | Meaning | Key fields |
|-------------|---------|-----------|
| `InternalError` | Bug or invariant violation | `statusCode: 500` |
| `ArgumentInvalidError` | Invalid argument passed to a function | — |
| `NotImplementedError` | Stub not yet implemented | — |
| `ValidationError` | User data failed validation | `meta.path` — which field failed |
| `AuthenticationError` | Request is not authenticated | — |
| `ObjectDisposedError` | Operation on a disposed object | — |
| `ApiError` | HTTP API call failed | `statusCode`, `meta.url`, `meta.method` |
| `ServerError` | Server-side processing failure | — |

To deserialise a received error object back to its typed class: `new Error(serialisedObject)` — returns the correct subclass if it was registered (all built-in classes are registered automatically).

## Related repos

This library is used by:
- **`react-ui`** (`@anupheaus/react-ui`) — React component library; uses `is`, `to`, `Event`, `Records`, errors, and models throughout.
- **`socket-api`** — WebSocket API layer; uses errors, models, and events for typed message passing.
- **`mxdb`** — MongoDB sync layer; uses models (`DataRequest`/`DataResponse`/`DataFilters`) as the query contract.

## Nuances and gotchas

- **`import { Error }` shadows `globalThis.Error`**: any file that imports the errors module's `Error` loses access to the built-in by that name. Use `import { Error as CommonError }` or reference `globalThis.Error` directly.
- **`Event` delegate is the subscribe function**: calling the delegate subscribes to it; `Event.raise(delegate, ...args)` raises it. This is the opposite of what you might expect if you think of the delegate as something you call to fire the event.
- **Prototype extensions run on import**: importing `@anupheaus/common` immediately mutates built-in prototypes. There is no opt-out. If you import a specific sub-file (e.g. `@anupheaus/common/src/extensions/is`), the other extensions are not registered.
- **`to.string` second-argument overloading**: when the first argument is a `number`, the second argument is a `numeral` format string; when the first is a `Date`, it is a date format string; otherwise it is a default value. The same parameter means different things depending on the first argument's type.

## Troubleshooting

**`process is not defined` in browser build**
You are importing a Node-only module (`createSettings`, `is.production`, logger file output). Guard with `typeof process !== 'undefined'` or exclude those modules from your browser bundle.

**Prototype extension methods are missing (e.g. `array.findById is not a function`)**
You imported a specific sub-file rather than `@anupheaus/common`. Import from the package root to trigger all side effects.

**Error deserialises as `BaseError` instead of the expected subclass**
The subclass was not registered. Call `Error.register(MyErrorClass)` after defining it, or ensure the file that defines it is imported before deserialisation occurs.

**TypeScript says `Error` is the built-in, not `BaseError`**
You have `import { Error }` from this package in scope, which shadows `globalThis.Error`. Rename the import: `import { Error as CommonError } from '@anupheaus/common'`.

For detailed module documentation, see [AGENTS.md](./AGENTS.md).
