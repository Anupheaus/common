import { BaseError } from './BaseError';

export class InternalError extends BaseError {
  public constructor(message: string);
  public constructor(message: string, info: object);
  public constructor(message: string, internalError: Error);
  public constructor(message: string, info: object, internalError: Error);
  public constructor(message: string, info?: object, internalError?: Error) {
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
