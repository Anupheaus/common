import { BaseError } from './BaseError';

export class ValidationError extends BaseError {
  public constructor(message: string, path: string) {
    super({
      message,
      meta: {
        path,
      },
    });
  }
}
