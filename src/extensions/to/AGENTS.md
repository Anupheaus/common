# extensions/to

The `to` coercion singleton — converts values between types, serialises/deserialises error-aware JSON, and computes JSON diffs.

## Overview

This subdirectory contains the full implementation of the `to` singleton exported from `src/extensions`. It is split from the parent `extensions/` directory because it has its own internal dependencies on `proxy`, `errors`, `inflection`, and `numeral`.

## Contents

### Coercion methods
- `to.string(value, format?)` — Converts to string. When `value` is a `number`, the second argument is a `numeral` format string. When `value` is a `Date`, it is a date format string. When `value` is anything else, it is a default value string.
- `to.number(value, defaultValue?)` — Parses to number; returns `defaultValue` (default `0`) if unparseable.
- `to.boolean(value, defaultValue?)` — Coerces to boolean; handles numeric strings, `'true'`/`'false'`, and function-valued inputs.
- `to.date(value, defaultValue?)` — Parses to `Date`; returns `defaultValue` if unparseable.
- `to.type(value, type)` — Converts to a given `StandardDataTypes` value.
- `to.plural(word)` / `to.singular(word)` — Pluralisation via `inflection`.

### Serialisation
- `serialise(value)` — Serialises a value to a JSON-safe object, preserving error types via `@error` marker.
- `deserialise(value)` — Reverses `serialise`, reconstructing typed error instances if an `@error` marker is present.

### Diff
- `to.diff(a, b)` — Returns a JSON Patch (`just-diff`) array of `Difference` objects describing the changes from `a` to `b`.

## Ambiguities and gotchas

- **`to.string` format vs default**: the second argument's meaning depends on the first argument's type. A string second argument is a `numeral` format when `value` is a number, a date format when `value` is a date, and a default when `value` is anything else. This is not visible from the TypeScript overload signatures at a glance.
- **`to.boolean` with functions**: if `value` is a function, it is called and the result is coerced — this is intentional for `BooleanOrFunc` patterns used in settings.

## Related

- [`../AGENTS.md`](../AGENTS.md) — parent extensions module; `to` is re-exported from there
