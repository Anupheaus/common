import { BaseError } from './base';

export class SecurityError extends BaseError {
  public constructor(message: string)
  public constructor(message: string, info: object);
  public constructor(message: string, info: object, internalError: Error);
  public constructor(message: string, info?: object, internalError?: Error) {
    super({
      message,
      code: 403,
      info,
      internalError,
    }, SecurityError);
  }

}
