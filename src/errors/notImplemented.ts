import { BaseError } from './base';

export class NotImplementedError extends BaseError {
  public constructor(message: string);
  public constructor(message: string, info: object);
  public constructor(message: string, info?: object) {
    super({
      code: 404,
      message,
      info,
    }, NotImplementedError);
  }
}
