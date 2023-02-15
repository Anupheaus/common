import { AnyObject, is } from '../extensions';
import { BaseError } from './BaseError';

interface Props {
  message: string;
  meta?: AnyObject;
  error?: Error;
}

export class InternalError extends BaseError {
  public constructor(message: string);
  public constructor(props: Props);
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
