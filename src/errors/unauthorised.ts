import { BaseError } from './base';

export class UnauthorisedError extends BaseError {
    constructor(message?: string) {
        super({
            code: 401,
            message: message || 'You are not authorised to view this resource.',
        }, UnauthorisedError);
    }
}
