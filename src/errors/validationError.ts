import { BaseError } from './base';

export class ValidationError extends BaseError {
  public constructor(message: string, path: string) {
    super({
      message,
      info: {
        path,
      },
    }, ValidationError);
  }
}
