# common — modules and exports

> Map of @anupheaus/common's modules, what each is for, and the entry-point rules.
>
> Status: accepted · Version 1

## Entry points

- Import from the package root, `@anupheaus/common`. The root `index.ts` registers every prototype extension as a side effect, then re-exports everything.
- Import from `@anupheaus/common/node` for Node-only code (e.g. the Axiom log sink).
- Never import a deep file such as `@anupheaus/common/src/extensions/is` in production code: it skips those side effects.

## Modules with their own doc

| Module | Use for |
|---|---|
| `extensions` | `is` type guards, `to` coercion, prototype extensions |
| `errors` | typed, serialisable error classes |
| `events` | typed pub/sub (`Event`) |
| `models` | shared data, sort, geometry and date types |
| `proxy` | observable / lazy objects (`createProxyOf`) |
| `logger` | levelled logging and remote sinks |
| `auditor` | append-only audit log and time travel |

## Smaller modules documented here

- `decorators` — `@bind` binds a method to its instance; `@throttle` caches a method's result for a duration.
- `cancellationToken` — `CancellationToken.create()`, then `.cancel()`, `.onCancelled()`, `.isCancelled`.
- `settings` — `createSettings`, built from `process.env`. Node-only.
- `wrappers` — `repeatOnError` retries a sync or async delegate, with `maxAttempts` or `onAttempt`.
- `utils` — `memoize`, `debounce`, `chain`, `captureConsole`.
- `subscriptions` — `createSubscriber<T>()` for plain broadcast; prefer `Event` when you need modes, ordering or replay.
- `Records` — id-keyed in-memory store with `onModified` and filtered variants.
- `Collection` — set-like collection, no id requirement.
- `ArrayModifications` — add / update / remove deltas, with guard events that can veto.
- `DoubleMap` — two-key map for row-and-column or source-and-target lookups.

Shared aliases: `Record` (`{ id: string }`), `Unsubscribe` (`() => void`), `PromiseMaybe<T>` (`T | Promise<T>`).
