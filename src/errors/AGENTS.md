# errors

Structured error classes with serialisation, status codes, and round-trip deserialisation via a type registry.

## Overview

All error classes extend `BaseError` (exported as `Error`). They carry `message`, `title`, `meta`, `statusCode`, `isAsync`, and `hasBeenHandled`. They serialise to plain objects via `toJSON()` and can be deserialised back to typed instances using the `@error` marker field — but only for classes that have called `Error.register()`.

**CRITICAL**: The base class is exported as `Error`, which shadows `globalThis.Error` in any file that imports it. Always import with an alias if you need both: `import { Error as CommonError } from '@anupheaus/common'`.

## Contents

### Base class
- `Error` (re-exported as the module's `Error`) — Base error with `message`, `title`, `meta`, `statusCode`, `code`, `isAsync`, `hasBeenHandled`. Static methods:
  - `Error.register(ErrorClass)` — Registers a subclass for deserialisation. Must be called for each subclass (done at the bottom of each error file).
  - `Error.isErrorObject(value)` — Returns `true` if `value` is a plain object with an `@error` key — i.e. a serialised error.

### Domain error classes

| Class | When to throw | Notable fields |
|-------|--------------|----------------|
| `InternalError` | Unexpected internal failures (bugs, invariant violations) | `statusCode: 500` |
| `ArgumentInvalidError` | A function received an invalid argument | — |
| `NotImplementedError` | Stub or placeholder not yet implemented | — |
| `ValidationError` | User-provided data failed validation | `meta.path: string` — the field path that failed |
| `AuthenticationError` | Request is not authenticated | — |
| `ObjectDisposedError` | An operation was called on an already-disposed object | — |
| `ApiError` | HTTP API call failed | `statusCode`, `meta.url`, `meta.method`, `meta.body` |
| `ServerError` | Server-side processing failure (distinct from API transport errors) | — |

## Architecture

**Serialisation round-trip**: `toJSON()` produces `{ '@error': 'ClassName', name, title, message, hasBeenHandled, isAsync, meta, statusCode, code }`. The `BaseError` constructor checks for this shape and, if found, routes to the registered subclass constructor for deserialisation. This means `new Error(serialisedJson)` returns an instance of the correct subclass, not a plain `BaseError`.

**Native `Error` wrapping**: if a native `globalThis.Error` is passed as the `props` argument, the constructor extracts `message` and `name` automatically, avoiding an awkward conversion step.

**Registration**: each error file ends with `Error.register(ClassName)`. This is required for the round-trip to work. New error subclasses must call `register` or they will deserialise as plain `BaseError` instances.

## Decision rationale

Using `@error` as a JSON marker (rather than, say, a `type` field) was chosen to avoid colliding with common `type` fields in API payloads, and to make it visually distinct when inspecting serialised data.

`isAsync` on the base class tracks whether the error originated in an async context, which affects how some error boundaries handle it.

`hasBeenHandled` lets error-handling middleware mark an error as already processed so upstream handlers can skip it.

## Ambiguities and gotchas

- **`Error` shadows `globalThis.Error`**: any file that imports `{ Error }` from this module loses access to the built-in `Error` by that name. Use `import { Error as CommonError }` or reference `globalThis.Error` explicitly.
- **`new Error(anotherError)` is idempotent**: if an `Error` instance is passed as `props`, the constructor returns the same instance unchanged. This means wrapping an existing error is safe but produces no new object.
- **`ApiError.statusCode` comes from `meta`**: the `statusCode` getter reads from `this.meta.statusCode`, not from the base class's `#props.statusCode`. Directly setting `statusCode` in `ApiErrorProps` stores it in `meta`, not in the base props field.
- **`ValidationError` requires both `message` and `path`**: unlike other subclasses, it does not accept an options object — the constructor signature is `(message: string, path: string)`.
