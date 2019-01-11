import { BaseError } from './base';

export class ObjectDisposedError extends BaseError {
    constructor(message?: string) {
        message = message || 'This instance has been disposed.';
        super({ message }, ObjectDisposedError);
    }
}
