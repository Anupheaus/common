/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectDisposedError } from '../errors/ObjectDisposedError';
import type { AnyFunction, PromiseMaybe } from '../extensions/global';

const HandlerRemoved = Symbol('handlerRemoved');
const EventType = Symbol('eventType');
const EventProps = Symbol('eventProps');
const PrevEventArgs = Symbol('prevEventArgs');

export type Unsubscribe = () => void;

// type AnonymousEvent = (...args: any[]) => any;

interface EventData {
  handlers: Set<Handler>;
  isEnabled: boolean;
}

const eventData = new WeakMap<EventDelegate, EventData>();

export interface EventDelegateProps {
  orderIndex?: number;
}

export interface CommonEventCreateProps {
  raisePreviousEventsOnNewSubscribers?: boolean;
}

export interface SingleResultEventCreateProps extends CommonEventCreateProps {
  mode: 'passthrough';
}

export interface ArrayResultEventCreateProps extends CommonEventCreateProps {
  mode?: 'concurrent' | 'in-turn';
}

export type EventCreateProps = SingleResultEventCreateProps | ArrayResultEventCreateProps;

interface CommonEventDelegate {
  [EventProps]: EventCreateProps;
  [PrevEventArgs]: Set<unknown[]>;
}

/* eslint-disable max-len */
export type ArrayResultEventDelegate<FuncType extends AnyFunction = AnyFunction> = ((delegate: FuncType, props?: EventDelegateProps) => Unsubscribe) & { [EventType]: 'array'; } & CommonEventDelegate;
export type SingleResultEventDelegate<FuncType extends AnyFunction = AnyFunction> = ((delegate: FuncType, props?: EventDelegateProps) => Unsubscribe) & { [EventType]: 'single'; } & CommonEventDelegate;
export type EventDelegate<FuncType extends AnyFunction = AnyFunction> = ArrayResultEventDelegate<FuncType> | SingleResultEventDelegate<FuncType>;

type MakeArrayResultEventDelegate<FuncType extends AnyFunction = AnyFunction> = FuncType extends ArrayResultEventDelegate<infer A> ? ArrayResultEventDelegate<A> : ArrayResultEventDelegate<FuncType>;
type MakeSingleResultEventDelegate<FuncType extends AnyFunction = AnyFunction> = FuncType extends SingleResultEventDelegate<infer A> ? SingleResultEventDelegate<A> : SingleResultEventDelegate<FuncType>;
/* eslint-enable max-len */

type GetArgsFromEvent<EventType> = EventType extends EventDelegate<(...args: infer A) => any> ? A : never;
/* eslint-disable @typescript-eslint/indent */
type GetReturnValueFromEvent<EventType> =
  EventType extends ArrayResultEventDelegate<(...args: any[]) => infer A> ? (A extends Promise<infer B> ? Promise<B[]> : A[])
  : EventType extends SingleResultEventDelegate<(...args: any[]) => infer A> ? (A extends Promise<infer B> ? Promise<B> : A)
  : never;
/* eslint-enable @typescript-eslint/indent */

interface Handler<T extends AnyFunction = AnyFunction> extends EventDelegateProps {
  handler: T;
}

function processHandlersConcurrently(handlers: Handler[], args: unknown[], hasHandler: (handler: Handler) => boolean): PromiseMaybe<unknown[]> {
  let promiseReturned = false;
  const results = handlers.map(item => {
    if (!hasHandler(item)) return HandlerRemoved;
    const result = item.handler(...args);
    if (result instanceof Promise) { promiseReturned = true; }
    return result;
  }).filter(item => item !== HandlerRemoved);
  return promiseReturned ? Promise.all(results) : results;
}

function processHandlersInTurn(handlers: Handler[], args: unknown[], hasHandler: (handler: Handler) => boolean) {
  const results: unknown[] = [];
  let promiseReturned = false;
  const promise = Promise.createDeferred<unknown[]>();

  const processHandlers = (remainingHandlers: Handler[]) => {
    const currentHandler = remainingHandlers.shift();
    if (currentHandler == null) { promise.resolve(results); return; }
    if (!hasHandler(currentHandler)) { processHandlers(remainingHandlers); return; }
    const result = currentHandler.handler(...args);
    if (result instanceof Promise) {
      promiseReturned = true;
      result.then(promiseResult => {
        results.push(promiseResult);
        processHandlers(remainingHandlers);
      }, error => {
        results.push(error);
        processHandlers(remainingHandlers);
      });
    } else {
      results.push(result);
      processHandlers(remainingHandlers);
    }
  };

  processHandlers(handlers.slice());
  if (promiseReturned) return promise;
  return results;
}

function processHandlersWithPassthrough(handlers: Handler[], args: unknown[], hasHandler: (handler: Handler) => boolean) {
  const processHandlers = (remainingHandlers: Handler[], passthroughValue?: unknown): unknown => {
    const currentHandler = remainingHandlers.shift();
    if (currentHandler == null) { return passthroughValue; }
    if (!hasHandler(currentHandler)) return processHandlers(remainingHandlers, passthroughValue);
    const result = currentHandler.handler(...args, passthroughValue);
    if (result instanceof Promise) {
      return result.then(promiseResult => processHandlers(remainingHandlers, promiseResult), error => processHandlers(remainingHandlers, error));
    } else {
      return processHandlers(remainingHandlers, result);
    }
  };
  return processHandlers(handlers.slice());
}

function applyPrevEventsToHandler<FuncType extends AnyFunction>(event: EventDelegate<FuncType>, handler: Handler<FuncType>): void {
  event[PrevEventArgs].forEach(args => handler.handler(...args));
}

function create<FuncType extends AnyFunction>(): MakeArrayResultEventDelegate<FuncType>;
// dummy overload for intellisense only
// eslint-disable-next-line max-len
function create<F extends AnyFunction>(props: (ArrayResultEventCreateProps | SingleResultEventCreateProps) & { ugh: never; }): MakeArrayResultEventDelegate<F> | MakeSingleResultEventDelegate<F>;
function create<FuncType extends AnyFunction>(props: ArrayResultEventCreateProps): MakeArrayResultEventDelegate<FuncType>;
function create<FuncType extends AnyFunction>(props: SingleResultEventCreateProps): MakeSingleResultEventDelegate<FuncType>;
function create<FuncType extends AnyFunction>(props: EventCreateProps = {}): EventDelegate<FuncType> {
  const handlers = new Set<Handler<FuncType>>();
  const event = ((delegate: FuncType, eventProps: EventDelegateProps = {}) => {
    if (!eventData.has(event as EventDelegate)) throw new ObjectDisposedError('Unable to subscribe to an event after it has been disposed.');
    const handler = { handler: delegate, ...eventProps };
    handlers.add(handler);
    if (props.raisePreviousEventsOnNewSubscribers === true) applyPrevEventsToHandler(event, handler);
    return () => { handlers.delete(handler); };
  }) as EventDelegate<FuncType>;
  event[EventType] = props?.mode === 'passthrough' ? 'single' : 'array';
  event[EventProps] = props;
  if (props.raisePreviousEventsOnNewSubscribers === true) event[PrevEventArgs] = new Set<unknown[]>();
  eventData.set(event as EventDelegate, { handlers, isEnabled: true });
  return event;
}

function raise<EventType extends EventDelegate>(event: EventType, ...args: GetArgsFromEvent<EventType>): GetReturnValueFromEvent<EventType> {
  const data = eventData.get(event);
  if (!data) throw new ObjectDisposedError('Unable to invoke event after it has been disposed.');
  const { handlers, isEnabled } = data;
  if (!isEnabled) return [] as unknown as GetReturnValueFromEvent<EventType>;
  const handlersInOrder = Array.from(handlers.values()).orderBy(({ orderIndex }) => orderIndex ?? 0);
  const { mode: processingMode = 'concurrent' } = event[EventProps];
  const processingMethod = (() => {
    if (processingMode === 'passthrough') return processHandlersWithPassthrough;
    if (processingMode === 'in-turn') return processHandlersInTurn;
    return processHandlersConcurrently;
  })();
  if (event[PrevEventArgs]) event[PrevEventArgs].add(args);
  return processingMethod(handlersInOrder, args, handler => handlers.has(handler)) as GetReturnValueFromEvent<EventType>;
}

export const Event = {
  create,
  raise,
  enable<EventType extends EventDelegate>(event: EventType): void {
    const data = eventData.get(event);
    if (!data) throw new ObjectDisposedError('Unable to enable an event after it has been disposed.');
    data.isEnabled = true;
  },
  disable<EventType extends EventDelegate>(event: EventType): void {
    const data = eventData.get(event);
    if (!data) throw new ObjectDisposedError('Unable to disable an event after it has been disposed.');
    data.isEnabled = false;
  },
  setEnabled<EventType extends EventDelegate>(event: EventType, isEnabled: boolean): void {
    const data = eventData.get(event);
    if (!data) throw new ObjectDisposedError('Unable to change the state of an event after it has been disposed.');
    data.isEnabled = isEnabled;
  },
  getSubscriptionCountFor<EventType extends EventDelegate>(event: EventType): number {
    const data = eventData.get(event);
    if (!data) throw new ObjectDisposedError('Unable to count the subscriptions of an event after it has been disposed.');
    return data.handlers.size;
  },
  isEnabled<EventType extends EventDelegate>(event: EventType): boolean {
    const data = eventData.get(event);
    if (!data) throw new ObjectDisposedError('Unable to determine the state of an event after it has been disposed.');
    return data.isEnabled;
  },
  dispose<EventType extends EventDelegate>(...events: EventType[]): void {
    let throwError = false;
    events.forEach(event => {
      if (!eventData.has(event)) { throwError = true; return; }
      eventData.delete(event);
    });
    if (throwError) throw new ObjectDisposedError('Unable to dispose of event as it has already been disposed.');
  },
};
