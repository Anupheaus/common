import '../extensions/array';
import { ObjectDisposedError } from '../errors/objectDisposed';
import { PromiseMaybe } from '../extensions/global';

export type EventDefinition = (...args: any[]) => PromiseMaybe;

export type Unsubscribe = () => void;

interface IEvent<TEventDefinition extends EventDefinition> {
  invoke: TEventDefinition;
  subscribe(delegate: TEventDefinition): Unsubscribe;
  dispose(): void;
}

export function createEvent<TEventDefinition extends EventDefinition>(): IEvent<TEventDefinition> {
  let subscribers: TEventDefinition[] = [];
  let hasBeenDisposed = false;
  return {
    subscribe(delegate: TEventDefinition): Unsubscribe {
      if (hasBeenDisposed) { throw new ObjectDisposedError('This event has been disposed and cannot be subscribed to.'); }
      subscribers.push(delegate);
      return () => {
        const index = subscribers.indexOf(delegate);
        if (index === -1) { return; }
        subscribers.splice(index, 1);
      };
    },
    invoke: ((...args: any[]): PromiseMaybe => {
      if (hasBeenDisposed) { throw new ObjectDisposedError('This event has been disposed and cannot be invoked.'); }
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
      subscribers = null;
    },
  };
}
