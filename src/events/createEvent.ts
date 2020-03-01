import '../extensions/array';
import { ObjectDisposedError } from '../errors/objectDisposed';
import { PromiseMaybe } from '../extensions/global';
import { NotImplementedError } from '../errors';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EventDefinition = (...args: any[]) => PromiseMaybe;

export type Unsubscribe = () => void;

export interface ICreateEventSubscribeOptions {
  immediatelyInvoke?: boolean;
}

export interface ICreateEvent<TEventDefinition extends EventDefinition> {
  invoke: TEventDefinition;
  isEnabled: boolean;
  subscribe(delegate: TEventDefinition): Unsubscribe;
  subscribe(delegate: TEventDefinition, subscriptionOptions: ICreateEventSubscribeOptions): Unsubscribe;
  dispose(): void;
}

interface ICreateEventOptions<TEventDefinition extends EventDefinition> {
  onSubscribe?(delegate: TEventDefinition): void;
}

export function createEvent<TEventDefinition extends EventDefinition>(): ICreateEvent<TEventDefinition>;
export function createEvent<TEventDefinition extends EventDefinition>(options: ICreateEventOptions<TEventDefinition>): ICreateEvent<TEventDefinition>;
export function createEvent<TEventDefinition extends EventDefinition>(options?: ICreateEventOptions<TEventDefinition>): ICreateEvent<TEventDefinition> {
  const { onSubscribe } = {
    onSubscribe: null,
    ...options,
  };
  const subscribers: TEventDefinition[] = [];
  let hasBeenDisposed = false;
  const event = {

    isEnabled: true,

    subscribe(delegate: TEventDefinition, subscribeOptions?: ICreateEventSubscribeOptions): Unsubscribe {
      subscribeOptions = {
        immediatelyInvoke: onSubscribe != null,
        ...subscribeOptions,
      };
      if (hasBeenDisposed) { throw new ObjectDisposedError('This event has been disposed and cannot be subscribed to.'); }
      subscribers.push(delegate);
      if (subscribeOptions.immediatelyInvoke) {
        if (onSubscribe) {
          onSubscribe(delegate);
        } else {
          throw new NotImplementedError('A onSubscribe delegate has not been provided for this event, so it cannot be immediately invoked at the source.');
        }
      }
      return () => {
        if (hasBeenDisposed) { return; }
        const index = subscribers.indexOf(delegate);
        if (index === -1) { return; }
        subscribers.splice(index, 1);
      };
    },

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    invoke: ((...args: any[]): PromiseMaybe => {
      if (hasBeenDisposed) { throw new ObjectDisposedError('This event has been disposed and cannot be invoked.'); }
      if (!event.isEnabled) { return; }
      let promiseReturned = false;
      const results = subscribers
        .slice()
        .map(subscriber => {
          if (!subscribers.includes(subscriber)) { return; }
          const result = subscriber(...args);
          if (result instanceof Promise) { promiseReturned = true; }
          return result;
        });
      if (promiseReturned) { return Promise.all(results).then(() => void 0); }
    }) as TEventDefinition,

    dispose(): void {
      if (hasBeenDisposed) { throw new ObjectDisposedError('This event has already been disposed and cannot be disposed again.'); }
      hasBeenDisposed = true;
      subscribers.clear();
      options = undefined; // potential memory leak if we don't clear this - allows the onSubscribe et al to be released
    },
  };
  return event;
}
