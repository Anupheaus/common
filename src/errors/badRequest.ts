import { BaseError } from './base';

export class BadRequestError extends BaseError {
    constructor(message: string);
    constructor(message: string, info: object);
    constructor(message: string, info?: object) {
        super({
            code: 400,
            message,
            info,
        }, BadRequestError);
    }
}
