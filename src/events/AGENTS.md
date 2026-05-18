# events

Typed pub/sub with three handler-execution modes and optional replay of previous events to new subscribers.

## Overview

This module provides `Event`, the primary event primitive across the library. Events are created with `Event.create()` and raised with `Event.raise()`. Subscribing returns an `Unsubscribe` function. The mode passed to `Event.create()` controls how handler results are collected and whether handlers run concurrently, sequentially, or as a passthrough pipeline.

## Contents

### Core API
- `Event` — Namespace with `create()` and `raise()` static methods. `create<FuncType>()` returns an `EventDelegate` typed to `FuncType`. Subscribing to the delegate returns an `Unsubscribe`.
- `Unsubscribe` — `() => void` function returned by every subscribe call.

### Event delegate types
- `ArrayResultEventDelegate<FuncType>` — Default mode. `raise()` collects all handler return values into an array (or `Promise<T[]>`).
- `SingleResultEventDelegate<FuncType>` — Passthrough mode. Each handler receives the previous handler's return value as an extra final argument; the last handler's result is the raise result.
- `EventDelegate<FuncType>` — Union of the above two.

### Configuration types
- `EventCreateProps` — Union of `ArrayResultEventCreateProps` and `SingleResultEventCreateProps`.
- `ArrayResultEventCreateProps` — `mode?: 'concurrent' | 'in-turn'` (default: `'concurrent'`), plus `raisePreviousEventsOnNewSubscribers?: boolean`.
- `SingleResultEventCreateProps` — `mode: 'passthrough'`.
- `EventDelegateProps` — Per-subscription options: `orderIndex?: number` controls handler order within a mode.

## Architecture

**Three execution modes:**

| Mode | Behaviour | Return type |
|------|-----------|-------------|
| `concurrent` (default) | All handlers called simultaneously; results collected | `T[]` or `Promise<T[]>` |
| `in-turn` | Handlers called one after another, each waits for the previous to finish | `T[]` or `Promise<T[]>` |
| `passthrough` | Each handler receives the previous handler's return value; final handler result is the raise result | `T` or `Promise<T>` |

**`raisePreviousEventsOnNewSubscribers`**: when `true`, every previous set of raise arguments is immediately replayed to any new subscriber at subscribe time. Useful for "current value" event patterns where late subscribers should receive the last state.

**`orderIndex`**: lower numbers run first. Handlers without `orderIndex` run in subscription order.

## Decision rationale

Three modes exist because different use cases need different composition semantics: concurrent collection for notifications, in-turn for sequential async pipelines, and passthrough for middleware/transform chains. A single mode would force callers to implement the others themselves.

`Event.raise()` is separate from the delegate (which is the subscribe function) so that the ability to raise can be kept private — callers can be given only the subscribe delegate.

## Ambiguities and gotchas

- **Calling the delegate subscribes; `Event.raise()` raises**: the event delegate is the subscribe function, not the raise function. This is the opposite of what you might expect if you think of the delegate as "the event to raise."
- **`passthrough` mode adds an extra argument**: the previous return value is appended as the last argument to each handler. A handler typed as `(x: number) => number` actually receives `(x: number, previousResult: number | undefined) => number` at runtime.
- **Disposed event**: subscribing to an event after it has been disposed throws `ObjectDisposedError`. Call unsubscribe before disposing.
- **Handler removal during raise**: if a handler unsubscribes itself during a raise, the `HandlerRemoved` symbol is used internally to skip it — this is safe and by design.
- **`raisePreviousEventsOnNewSubscribers` stores all previous arg sets**: it stores every set of arguments ever raised, not just the last one. Memory grows unboundedly if raises are frequent. Use with care.
