import { BaseError } from './base';

export class ArgumentInvalidError extends BaseError {
  public constructor(argumentName: string, value?: unknown) {
    super({ message: `The argument '${argumentName}' was invalid.`, info: { value } }, ArgumentInvalidError);
  }
}
