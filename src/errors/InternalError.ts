import type { AnyObject, ErrorLike } from '../extensions';
import { is } from '../extensions/is';
import { Error } from './BaseError';

interface Props {
  message: string;
  meta?: AnyObject;
  error?: ErrorLike | string;
}

export class InternalError extends Error {
  public constructor(message: string);
  public constructor(props: Props);
  public constructor(error: ErrorLike);
  public constructor(message: string, props: Omit<Props, 'message'>);
  public constructor(messageOrProps: string | Props, otherProps?: Omit<Props, 'message'>) {
    const props = is.string(messageOrProps) ? { ...otherProps, message: messageOrProps } : messageOrProps;
    super({
      title: 'Internal Error',
      statusCode: 500,
      ...props,
    });
  }
}

Error.register(InternalError);
