import { Unsubscribe } from './createEvent';
import { ObjectDisposedError } from '../errors/objectDisposed';

interface IEventUnsubscription {
  add(unsubscription: Unsubscribe): void;
  unsubscribeAllAndDispose(): void;
}

export function createEventUnsubscribeCache(): IEventUnsubscription {
  let unsubscriptions: Unsubscribe[] = [];
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
      unsubscriptions = null;
    },
  };
}
