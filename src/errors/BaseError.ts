import { is } from '../extensions/is';
import type { AnyObject, ConstructorOf } from '../extensions';

const errorTypes = new Map<string, ConstructorOf<Error>>();

interface InternalProps {
  error?: unknown;
  message: string;
  title: string;
  meta?: AnyObject;
  statusCode?: number;
  isAsync: boolean;
}

interface Props extends Partial<InternalProps> { }

export class Error extends global.Error {
  constructor(props: Props) {
    super('');
    this.#props = {
      message: 'Unexpected Error',
      title: 'Unexpected Error',
      isAsync: false,
    };
    this.#hasBeenHandled = false;
    Object.setPrototypeOf(this, new.target.prototype);
    const anyProps = props as AnyObject;
    if (anyProps instanceof Error) return anyProps;
    if (typeof (anyProps['@error']) === 'string') {
      const errorType = errorTypes.get(anyProps['@error']);
      if (errorType && errorType !== new.target) return new errorType(props);
    }
    const { error } = props;
    if (error != null) {
      if (typeof ((error as AnyObject)['@error']) === 'string') {
        const errorType = errorTypes.get((error as AnyObject)['@error']);
        if (errorType) return new errorType(props);
      }
      if (error instanceof global.Error) {
        props.message = error.message;
        props.title = error.name;
        this.stack = error.stack;
      }
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
    if (error instanceof Error) return error;
  }

  #props: InternalProps;
  #hasBeenHandled: boolean;

  public static register<T extends ConstructorOf<Error>>(errorType: T): void {
    errorTypes.set(errorType.name, errorType);
  }

  public static isErrorObject(value: unknown): value is ReturnType<InstanceType<typeof Error>['toJSON']> {
    return is.plainObject(value) && Reflect.has(value, '@error');
  }

  public get title() { return this.#props.title; }
  public get hasBeenHandled() { return this.#hasBeenHandled; }
  public get meta() { return this.#props.meta; }
  public get isAsync() { return this.#props.isAsync; }

  public markAsHandled(): void {
    this.#hasBeenHandled = true;
  }

  public toJSON() {
    return {
      '@error': this.name,
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
