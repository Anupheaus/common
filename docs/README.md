# Vision docs

Architecture decisions, patterns and coding standards. Each doc is short and covers one topic: scan this index, then open only the docs your task touches. Every folder also has an `index.md` describing what's in it.

These files are maintained by the Architect agent in Forge and synced from there, so edits made here by hand will be overwritten. To change or record a decision, tell any Forge agent; it goes to the Architect.

## [Patterns](patterns/index.md)

Patterns this library owns: the typed error classes and when to throw which.

- [Throw typed errors from @anupheaus/common](patterns/typed-errors.md): Use the most semantically accurate typed error class instead of Error, so catch boundaries can guard precisely.

## [Guides](guides/index.md)

What this repo is, its dependencies, and how to add and read logs.

- [Logging with @anupheaus/common](guides/logging.md): How to add and read logs with the Logger from @anupheaus/common, and where the log service's own docs live.
- [common — repo overview](guides/repo-overview.md): What @anupheaus/common is, what it depends on, and who reads its docs.
