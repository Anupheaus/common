import { ApiError, ApiErrorProps } from './ApiError';

interface Props extends Pick<ApiErrorProps, 'url' | 'method' | 'message' | 'body'> { }

export class AuthenticationError extends ApiError {
  constructor({ url, method, message, body }: Props = {}) {
    super({ url, method, statusCode: 401, title: 'Authentication Error', message: message ?? 'You need to sign in.', body });
  }
}
