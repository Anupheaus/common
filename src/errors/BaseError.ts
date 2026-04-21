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
  code?: unknown;
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
    const propsAsAny = props as any;
    if (propsAsAny instanceof globalThis.Error) {
      // A native Error was passed directly as props — extract its message and name
      props = { message: propsAsAny.message || undefined, title: propsAsAny.name } as Props;
    }
    if (typeof (anyProps['@error']) === 'string') {
      const errorType = errorTypes.get(anyProps['@error']);
      if (errorType && errorType !== new.target) return new errorType(props);
    }
    const { error } = props;
    if (error != null) {
      if (typeof error === 'string') {
        if (error.length > 0) props.message = error;
      } else if (typeof error === 'object') {
        const anyError = error as AnyObject;
        const errorTypeAsString = anyError['@error'];
        if (errorTypeAsString != null) {
          const errorType = errorTypes.get(errorTypeAsString as string);
          if (errorType) return new errorType(props);
        }
        if (typeof anyError.message === 'string' && anyError.message.length > 0) props.message = anyError.message;
        if (typeof anyError.name === 'string' && anyError.name.length > 0) props.title = anyError.name;
        else if (typeof (error as object).constructor?.name === 'string' && (error as object).constructor.name !== 'Object') props.title = (error as object).constructor.name;
        if (typeof anyError.stack === 'string') this.stack = anyError.stack;
        if (anyError.code != null) props.code = anyError.code;
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
      code: this.#props.code,
    };
  }

}
