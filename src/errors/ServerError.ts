import { ApiError } from './ApiError';
import type { ApiErrorProps } from './ApiError';
import { Error } from './BaseError';

interface Props extends Pick<ApiErrorProps, 'url' | 'method' | 'message' | 'body'> { }

export class ServerError extends ApiError {
  constructor({ url, method, message, body }: Props = {}) {
    super({ url, method, statusCode: 500, title: 'Server Error', message: message ?? 'A server error has occurred when making this request.', body });
  }
}

Error.register(ServerError);
