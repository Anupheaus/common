import { BaseError } from './base';

export class InternalError extends BaseError {
    constructor(message: string)
    constructor(message: string, info: any);
    constructor(message: string, internalError: Error);
    constructor(message: string, info: any, internalError: Error);
    constructor(message: string, info?: any, internalError?: Error) {
        if (info instanceof Error) {
            internalError = info;
            info = undefined;
        }
        super({
            message,
            code: 500,
            info,
            internalError,
        }, InternalError);
    }

}
