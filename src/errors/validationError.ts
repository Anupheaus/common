import { BaseError } from './base';

export class ValidationError extends BaseError {
    constructor(message: string, path: string) {
        super({
            message,
            info: {
                path,
            },
        }, ValidationError);
    }
}
