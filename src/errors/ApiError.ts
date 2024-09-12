import type { AnyObject } from '../extensions';
import { Error } from './BaseError';

export interface ApiErrorProps {
  title?: string;
  message?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'DELETE';
  body?: AnyObject;
  statusCode?: number;
  meta?: AnyObject;
}

export class ApiError extends Error {
  constructor({ message, title, url, method, body, statusCode, meta }: ApiErrorProps = {}) {
    super({ message: message ?? 'An API error has occurred.', title: title ?? 'API Error', isAsync: true, meta: { url, method, body, statusCode, ...meta } });
    // Reflect.defineProperty(this, 'statusCode', { get: () => { console.log('here'); return statusCode; }, configurable: true, enumerable: true });
  }

  public get statusCode(): number { return (this.meta ?? {}).statusCode ?? 500; }
}

Error.register(ApiError);
