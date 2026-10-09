# Vision docs

Architecture decisions, patterns and coding standards. Each doc is short and covers one topic: scan this index, then open only the docs your task touches. Every folder also has an `index.md` describing what's in it.

These files are maintained by the Architect agent in Forge and synced from there, so edits made here by hand will be overwritten. To change or record a decision, tell any Forge agent; it goes to the Architect.

## [Patterns](patterns/index.md)

Recurring shapes in @anupheaus/common: events, observable proxies and typed errors.

- [Events: typed pub/sub](patterns/events.md): Use Event for typed pub/sub: its three execution modes, ordering, replay and when to use createSubscriber.
- [Observable proxies (createProxyOf)](patterns/proxy.md): Wrap nested objects in createProxyOf to observe reads and writes and track which paths were explicitly set.
- [Throw typed errors from @anupheaus/common](patterns/typed-errors.md): Use the most semantically accurate typed error class instead of Error, so catch boundaries can guard precisely.

## [Data model](architecture/data/index.md)

The shared data, sort, geometry and date types other packages build their contracts on.

- [Shared data, sort, geometry and date types](architecture/data/shared-models.md): The shared data-request, sort, array-operation, geometry and date types other packages build their contracts on.

## [Guides](guides/index.md)

How to work with @anupheaus/common: module map, extensions, logging and Node-only code.

- [Extensions: is, to and prototype extensions](guides/extensions.md): What the is and to helpers cover, which prototype extensions the package installs, and their gotchas.
- [Logging with @anupheaus/common](guides/logging.md): How to add and read logs with the Logger from @anupheaus/common, and where the log service's own docs live.
- [common — modules and exports](guides/modules.md): Map of @anupheaus/common's modules, what each is for, and the entry-point rules.
- [Node-only code and browser safety](guides/node-and-browser-entries.md): Which parts of the package are Node-only and the rule that keeps the main browser entry free of Node built-ins.
- [common — repo overview](guides/repo-overview.md): What @anupheaus/common is, what it depends on, and who reads its docs.
