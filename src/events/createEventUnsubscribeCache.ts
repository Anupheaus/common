import { ObjectDisposedError } from '../errors/objectDisposed';
import { Unsubscribe } from './createEvent';

interface IEventUnsubscription {
  add(unsubscription: Unsubscribe): void;
  unsubscribeAllAndDispose(): void;
}

export function createEventUnsubscribeCache(): IEventUnsubscription {
  const unsubscriptions: Unsubscribe[] = [];
  let hasBeenDisposed = false;
  return {
    add(unsubscription: Unsubscribe): void {
      if (hasBeenDisposed) { throw new ObjectDisposedError('The unsubscriptions instance has already been disposed.'); }
      unsubscriptions.push(unsubscription);
    },
    unsubscribeAllAndDispose(): void {
      if (hasBeenDisposed) { throw new ObjectDisposedError('The unsubscriptions instance has already been disposed.'); }
      hasBeenDisposed = true;
      unsubscriptions.forEach(unsubscribe => unsubscribe());
      unsubscriptions.clear();
    },
  };
}
