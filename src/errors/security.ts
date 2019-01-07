import { BaseError } from './base';

export class SecurityError extends BaseError {
    constructor(message: string)
    constructor(message: string, info: any);
    constructor(message: string, info: any, internalError: any);
    constructor(message: string, info?: any, internalError?: any) {
        super({
            message,
            code: 403,
            info,
            internalError,
        }, SecurityError);
    }

}
