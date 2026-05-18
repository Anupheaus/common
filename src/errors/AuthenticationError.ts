import { ApiError } from './ApiError';
import type { ApiErrorProps } from './ApiError';
import { Error } from './BaseError';

interface Props extends Pick<ApiErrorProps, 'url' | 'method' | 'message' | 'body' | 'meta'> { }

export class AuthenticationError extends ApiError {
  constructor(message: string);
  constructor(props: Props);
  constructor(messageOrProps: string | Props) {
    let props = messageOrProps;
    if (typeof (props) === 'string') props = { message: props };
    super({ method: 'GET', ...props, statusCode: 401, title: 'Authentication Error' });
  }
}

Error.register(AuthenticationError);
