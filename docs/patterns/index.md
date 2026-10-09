# Patterns

Recurring shapes in @anupheaus/common: events, observable proxies and typed errors.

## Docs

- [Events: typed pub/sub](events.md): Use Event for typed pub/sub: its three execution modes, ordering, replay and when to use createSubscriber.
- [Observable proxies (createProxyOf)](proxy.md): Wrap nested objects in createProxyOf to observe reads and writes and track which paths were explicitly set.
- [Throw typed errors from @anupheaus/common](typed-errors.md): Use the most semantically accurate typed error class instead of Error, so catch boundaries can guard precisely.
