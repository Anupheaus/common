/* eslint-disable @typescript-eslint/no-explicit-any */
import { ObjectDisposedError } from '../errors';

const handlerRemoved = Symbol('handlerRemoved');

export type Unsubscribe = () => void;

type AnonymousEvent = (...args: any[]) => any;

interface EventData {
  handlers: AnonymousEvent[];
  isEnabled: boolean;
}

const eventData = new WeakMap<EventDelegate, EventData>();

type EventDelegate<FuncType extends AnonymousEvent = AnonymousEvent> = (delegate: FuncType) => Unsubscribe;

type GetArgsFromEvent<EventType> = EventType extends EventDelegate<(...args: infer A) => any> ? A : never;
type GetReturnValueFromEvent<EventType> = EventType extends EventDelegate<(...args: any[]) => infer A> ? (A extends Promise<infer B> ? Promise<B[]> : A[]) : never;

export const Event = {
  create<FuncType extends AnonymousEvent>(): EventDelegate<FuncType> {
    const handlers: FuncType[] = [];
    const event: EventDelegate<FuncType> = (delegate: FuncType) => {
      if (!eventData.has(event as EventDelegate)) throw new ObjectDisposedError('Unable to subscribe to an event after it has been disposed.');
      handlers.push(delegate);
      return () => {
        const index = handlers.indexOf(delegate);
        if (index === -1) return;
        handlers.splice(index, 1);
      };
    };
    eventData.set(event as EventDelegate, { handlers, isEnabled: true });
    return event;
  },
  raise<EventType extends EventDelegate>(event: EventType, ...args: GetArgsFromEvent<EventType>): GetReturnValueFromEvent<EventType> {
    const data = eventData.get(event);
    if (!data) throw new ObjectDisposedError('Unable to invoke event after it has been disposed.');
    const { handlers, isEnabled } = data;
    if (!isEnabled) return [] as unknown as GetReturnValueFromEvent<EventType>;
    let promiseReturned = false;
    const results = handlers
      .map(handler => {
        if (!handlers.includes(handler)) return handlerRemoved;
        const result = handler(...args);
        if (result instanceof Promise) { promiseReturned = true; }
        return result;
      })
      .filter(value => value !== handlerRemoved) as GetReturnValueFromEvent<EventType>;
    if (promiseReturned) { return Promise.all(results) as GetReturnValueFromEvent<EventType>; }
    return results;
  },
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
    return data.handlers.length;
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
}
