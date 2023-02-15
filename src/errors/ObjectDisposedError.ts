import { Error } from './BaseError';

export class ObjectDisposedError extends Error {
  public constructor(message?: string) {
    message = message || 'This instance has been disposed.';
    super({ message });
  }
}
