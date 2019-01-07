import { BaseError } from './base';

export class ArgumentInvalidError extends BaseError {
    constructor(argumentName: string, value?: any) {
        super({ message: `The argument '${argumentName}' was invalid.`, info: { value } }, ArgumentInvalidError);
    }
}
