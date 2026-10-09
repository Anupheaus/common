# Events: typed pub/sub

> Use Event for typed pub/sub: its three execution modes, ordering, replay and when to use createSubscriber.
>
> Status: accepted · Version 1

`Event` is the standard pub/sub primitive in this package; `createSubscriber` covers simple broadcast.

```ts
const onChanged = Event.create<(id: string) => void>();
onChanged.subscribe(handle);      // subscribing calls the delegate
Event.raise(onChanged, id);       // raising is separate, so it can stay private
```

## Modes

| Mode | Handlers | `raise` returns |
|---|---|---|
| `concurrent` (default) | called at once | `T[]` |
| `in-turn` | one after another, each awaited | `T[]` |
| `passthrough` | each receives the previous result as an extra last argument | `T` |

- `raisePreviousEventsOnNewSubscribers: true` replays every past raise to a new subscriber. Use it for "current value" events, and remember it stores every set of arguments, so memory grows with raises.
- `orderIndex` on a subscription runs lower numbers first; handlers without it keep subscription order.
- Subscribing after an event is disposed throws `ObjectDisposedError`.
- Prefer `createSubscriber` when you need plain broadcast with no ordering, modes or replay.
- `Unsubscribe` (`() => void`) is returned by every subscribe call; store it and call it to detach.
