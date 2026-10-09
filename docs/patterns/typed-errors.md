# Throw typed errors from @anupheaus/common

> Use the most semantically accurate typed error class instead of Error, so catch boundaries can guard precisely.
>
> Status: accepted · Version 2

## When to use

Whenever throwing an error anywhere in the stack that uses this repo.

## How to apply

- Use the most accurate class from `@anupheaus/common` (`APIError`, `AuthenticationError`, …) rather than the `Error` constructor. The classes live in `src/errors/`.
- Typed errors allow precise `instanceof` guards at catch boundaries and expose structured detail instead of a parsed message.
- If no existing class fits and a typed error would genuinely help, suggest a new one to the user rather than falling back to `Error`.

```ts
throw new AuthenticationError({ message: 'User is not authenticated' });

if (err instanceof AuthenticationError) { /* redirect to login */ }
if (err instanceof APIError) { /* show API failure UI */ }
```

## Avoid

`throw new Error('...')` except as a last resort, catching `Error` broadly when a specific class is meant, and encoding context in a message string instead of structured fields.
