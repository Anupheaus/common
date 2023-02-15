import type { AnyObject } from '../extensions';
import { BaseError } from './BaseError';

export class NotImplementedError extends BaseError {
  public constructor(message: string, meta?: AnyObject) {
    super({
      statusCode: 404,
      message,
      meta,
    });
  }
}
