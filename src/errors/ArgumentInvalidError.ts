import { BaseError } from './BaseError';

export class ArgumentInvalidError extends BaseError {
  public constructor(argumentName: string, value?: unknown) {
    super({ message: `The argument '${argumentName}' was invalid.`, meta: { value } });
  }
}
