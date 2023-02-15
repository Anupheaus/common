import { Error } from './BaseError';

export class ValidationError extends Error {
  public constructor(message: string, path: string) {
    super({
      message,
      meta: {
        path,
      },
    });
  }
}
