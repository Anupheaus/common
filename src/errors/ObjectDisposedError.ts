import { BaseError } from './BaseError';

export class ObjectDisposedError extends BaseError {
  public constructor(message?: string) {
    message = message || 'This instance has been disposed.';
    super({ message });
  }
}
