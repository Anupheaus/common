# common — repo overview

> What @anupheaus/common is, what it depends on, and who reads its docs.
>
> Status: accepted · Version 1

## What it is

`@anupheaus/common` is the lowest-level shared TypeScript library: extensions, models, logging with its Axiom sink, auditing, collections, and the typed error classes in `src/errors/`. Almost everything in the stack uses it.

## Depends on

Nothing. It is the bottom of the stack and imports no other repo.

## Who depends on it

`react-ui`, `nexus`, `mxdb` and `vision`. Changing a contract here — a signature, an error class, a shared model — opens the docs of those repos in the same change.

## Docs held here

- [Logging](logging.md) — adding and reading logs with `Logger`.
- [Typed errors](../patterns/typed-errors.md) — the error classes and when to throw which.

The log aggregation service and its MCP tooling are not part of this repo: they belong to the application that runs them, which documents them.
