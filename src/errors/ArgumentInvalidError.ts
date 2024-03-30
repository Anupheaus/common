import { Error } from './BaseError';

export class ArgumentInvalidError extends Error {
  public constructor(argumentName: string, value?: unknown) {
    super({ message: `The argument '${argumentName}' was invalid.`, meta: { value } });
  }
}

Error.register(ArgumentInvalidError);
