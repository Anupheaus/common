import type { AnyObject } from '../extensions';
import { Error } from './BaseError';

export interface ApiErrorProps {
  title?: string;
  message?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'OPTIONS' | 'HEAD' | 'DELETE';
  body?: AnyObject;
  statusCode?: number;
}

export class ApiError extends Error {
  constructor({ message, title, url, method, body, statusCode }: ApiErrorProps = {}) {
    super({ message: message ?? 'An API error has occurred.', title: title ?? 'API Error', isAsync: true, meta: { url, method, body, statusCode } });
  }
}
