import type { AnyObject } from '../extensions';

interface InternalProps {
  error?: unknown;
  message: string;
  title: string;
  meta?: AnyObject;
  statusCode?: number;
  isAsync: boolean;
}

interface Props extends Partial<InternalProps> { }

export class BaseError extends Error {
  constructor(props: Props) {
    super('');
    Object.setPrototypeOf(this, new.target.prototype);
    const { error } = props;
    if (error != null && error instanceof Error) {
      props.message = error.message;
      props.title = error.name;
      this.stack = error.stack;
    }
    this.name = new.target.name;
    this.#props = {
      message: 'Unexpected Error',
      title: 'Unexpected Error',
      isAsync: false,
      ...props
    };
    Reflect.defineProperty(this, 'message', { get: () => this.#props.message, configurable: true, enumerable: true });
    this.#hasBeenHandled = false;
    if (error instanceof BaseError) return error;
  }

  #props: InternalProps;
  #hasBeenHandled: boolean;

  public get title() { return this.#props.title; }
  public get hasBeenHandled() { return this.#hasBeenHandled; }
  public get meta() { return this.#props.meta; }
  public get isAsync() { return this.#props.isAsync; }

  public markAsHandled(): void {
    this.#hasBeenHandled = true;
  }

  public toJSON() {
    return {
      name: this.name,
      title: this.#props.title,
      message: this.#props.message,
      hasBeenHandled: this.#hasBeenHandled,
      isAsync: this.#props.isAsync,
      meta: this.#props.meta,
      statusCode: this.#props.statusCode,
      stack: this.stack,
    };
  }

}
