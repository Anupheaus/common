import type { AnyObject } from '../extensions';
import { Error } from './BaseError';

export class NotImplementedError extends Error {
  public constructor(message: string, meta?: AnyObject) {
    super({
      statusCode: 404,
      message,
      meta,
    });
  }
}

Error.register(NotImplementedError);
