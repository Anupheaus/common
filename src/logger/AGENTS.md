# logger

Levelled, coloured logger with sub-logger support, batching listeners, and pluggable remote sinks.

## Overview

This module provides the `Logger` class and supporting infrastructure for structured application logging. It supports eight levels (silly through always), optional timestamps, optional colours, global meta, and file output (Node-only). Log entries can be captured by `LoggerListener` instances (for batching and remote delivery) and by `LoggerService` sinks (pre-built integrations like Grafana Loki and New Relic).

## Contents

### Core
- `Logger` — Main class. Constructed with `new Logger(name, settings?)`. Methods: `silly`, `trace`, `debug`, `info`, `warn`, `error`, `fatal`, `always`. `error()` also accepts an `Error` instance. `createSubLogger(name)` creates a child logger whose `names` array is `[parentName, childName]`.
- `LogLevels` — Constant map of level name to numeric value (`silly: 0` … `always: 7`). Re-exported from `logger-utils.ts`.
- `always` — Level 7; bypasses `minLevel` filtering and is always emitted regardless of settings.

### Flight recorder (`logger-flight-recorder.ts`, `logger-redaction.ts`)

Every entry of every level goes into a ring buffer for its **scope**, so a listener can take info and above as it happens and still get the debug trail ahead of an error, without raising the log level.

- **Scope**: `Logger.runInScope(delegate, { id?, bufferSize? })` opens one (a socket action, REST request or job) on its own `AsyncLocalStorage`; everything the delegate awaits logs into that buffer, by any logger (module-level ones too), and each entry carries the scope's `scopeId`. `Logger.getCurrentScopeId()` reads it. Scopes never share a buffer, so one tenant's lines cannot appear in another's trail. Code outside any scope uses a small shared buffer (`sharedBufferSize`, default 50). In the browser there is no async context: `runInScope` just calls the delegate, and each root logger keeps one buffer (`bufferSize`).
- **Listener options** (`Logger.registerListener`): `minLevel` (default 0, every entry, as before) is the lowest level delivered as it happens; `flushLevel` (default error) is the level that flushes; `flushIntervalMs` (default 10,000) is the storm guard.
- **Flush**: when an entry at or above `flushLevel` is delivered, that listener first gets the scope's entries below `minLevel` that it has not had since its last flush, oldest first, as `{ ...entry, preceding: true }` with the error's `scopeId`; then the error. Entries already delivered (at or above `minLevel`) are not resent. Within `flushIntervalMs` of a flush for that scope, an error ships alone, and the next flush carries what came since the last one.
- **Lazy**: `silly`, `trace`, `debug`, `info`, `warn` and `always` take `message` and `meta` as a value or a function. The function runs only when the console, an `onLog` callback or a listener takes the entry, and once however many take it. A throwing function becomes `[log message failed: …]`, never an exception.
- **Redaction** at write time, before the entry is buffered: `Logger.configureFlightRecorder({ bufferSize?, sharedBufferSize?, redactedKeys? })`. A meta key whose name (ignoring case, `-`, `_`) equals or ends with one of `password, token, authorization, cookie, credential, privateKey, prf, secret` has its value replaced with `[redacted]`, at any depth in plain objects and arrays. The caller's object is never changed; `Error`s and class instances are passed through unwalked. Lazy meta is redacted when it is built. The console sees the redacted meta too. `configureFlightRecorder` applies to scopes opened after it and resets the out-of-scope buffers.

### Entry types and listener infrastructure
- `LoggerEntry` — `{ timestamp: DateTime; level: number; names: string[]; message: string; meta?: AnyObject; scopeId?: string; preceding?: true }` — the shape of a captured log entry. `names` is an array to support sub-loggers (e.g. `['App', 'Auth']`).
- `LoggerListener` — Collects log entries and batches them, calling `onTrigger(entries)` on an interval or when `maxEntries` is reached. Used internally by the Logger's global listener registry.
- `LoggerListenerSettings` — `{ sendInterval?, maxEntries?, minLevel?, flushLevel?, flushIntervalMs?, onTrigger }` — configuration for a `LoggerListener`.

### Remote sinks (`logger-services.ts`, not exported from index)
- `useGrafanaLoki(userName, password, server?)` — Returns an `onTrigger` callback that pushes entries to Grafana Loki.
- `useAxiom({ token, dataset, app, env, url?, maxAttempts?, retryDelayMs?, maxQueueEntries?, warn?, fetch? })` (`logger-axiom.ts`) — **Node-only: import it from `@anupheaus/common/node`**, not the main entry. Ships entries to Axiom's ingest API (`<url>/v1/datasets/<dataset>/ingest`, default `https://api.axiom.co`) as gzipped JSON events.
  - Every event carries `_time`, the configured `app` and `env`, its `level` name, its `logger` names, the `message` and `meta`. An `Error` in the meta is sent as name, message and stack.
  - An entry from a logging scope also carries `scopeId`, and a flight-recorder trail entry `preceding: true` (see Flight recorder).
  - A 429, a 5xx or a network failure is retried with backoff (1s, 2s, 4s; 4 attempts). Any other refusal, or the last failure, drops that batch with one warning.
  - One send at a time; the queue is bounded (10,000 entries, oldest dropped first) so an outage cannot exhaust memory.
  - It reports its own failures through `warn` (default `console.warn`), never through the logger it ships for.
- `useNewRelic(apiKey, server?, labels?)` — Returns an `onTrigger` callback that pushes entries to New Relic, labelled with `labels.app` / `labels.env` (default `vision` / `dev`, the old hard-coded values).
- `useClippedFileLog(filePath, options?)` — Appends formatted entries to a local file and clips to `maxBytes` (default 200 MB), keeping the newest tail. Serialized writes; creates parent directories as needed.

These are not exported from `index.ts`; import directly from `./logger-services` if needed.

### Browser safety

The main entry (`dist/index.mjs`) is bundled into browser apps, so it imports **no Node built-in**, statically or dynamically.
- Code needing one either lives in the Node-only entry `src/node.ts` (`@anupheaus/common/node`, e.g. `useAxiom`, which needs `zlib`), or loads the built-in at call time with `nodeBuiltin(id)` (`nodeBuiltins.ts`, via `process.getBuiltinModule`, which bundlers never see). The Logger's file output, `useClippedFileLog` and `Logger.provide`'s `AsyncLocalStorage` do the latter.
- `scripts/check-browser-entry.mjs` (`pnpm run check:browser-entry`) fails the build when the main entry imports a built-in. CI runs it in Validate and before every publish. Common 0.2.10 shipped `zlib`, `fs` and `util` in the main entry and broke every browser build.

### Internal / Node-only files (not exported)
- `logger-utils.ts` — Defines `LogLevels` constant and `getLevelAsString(level)` helper. Re-exported via `logger.ts`.
- `nodeUtils.ts` — `writeToFile(filename, message, meta)` — Node.js file-append helper used when `filename` is set in `LoggerSettings`. Not exported.
- `nodeTest.ts` — Scratch file for manual local testing of the logger output. Not a module; not exported; safe to ignore.

## Architecture

A global `registeredListeners: Set<LoggerListener>` in `logger.ts` is offered every log entry that any `Logger` instance emits (each listener's `minLevel` decides whether it takes it as it happens). Individual `Logger` instances do not own their listener sets — they broadcast to the shared global set.

`asyncLocalStorage` (dynamically imported from `async_hooks`) enables async-context-based logger resolution — if code runs within a `Logger.run(logger, fn)` context, `asyncLocalStorage.getStore()` returns that logger. This is used for implicit logger propagation in async call trees.

The `minLevel` default is `5` (error). Levels error, fatal, warn, and always bypass `minLevel` — they are always emitted.

## Decision rationale

`always` (level 7) is numerically above `fatal` (level 6) so that a simple `level >= minLevel` comparison cannot suppress it — it always passes the filter regardless of `minLevel`. The name "always" was chosen over "critical" to make this behaviour self-documenting.

Sub-loggers share the parent's `LoggerSettings` and broadcast to the same global listener set. They do not create a separate logger hierarchy — they only extend the `names` array for contextual identification in log entries.

## Ambiguities and gotchas

- **`logger.always` is not for every message**: it is for critical messages that should never be filtered (e.g. startup confirmation, fatal shutdown notice). Overusing it defeats filtering entirely.
- **`names` is an array**: single loggers have `names: ['LoggerName']`; sub-loggers have `names: ['Parent', 'Child']`. Sinks that format entries should `names.join(' > ')` rather than assuming a single name.
- **`logger-services.ts` is not in the index**: `useGrafanaLoki`, `useNewRelic`, and `useClippedFileLog` are available via `Logger.services`. Grafana Loki and New Relic hardcode `'app': 'vision'` and `'env': 'dev'` in the stream labels — these may need updating for other projects.
- **File output is Node-only**: the `filename` setting in `LoggerSettings` routes entries to `nodeUtils.writeToFile`, which uses `fs`. This will throw in browser environments.
- **`nodeTest.ts` is not a test suite**: it is a scratch script for manually verifying log output format. It is not run by the test runner.
