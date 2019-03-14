// tslint:disable:interface-name
import './object';
import { getCancellableAsyncToken, ICancelAsyncToken } from '../decorators/cancellableAsync';

class PromiseConstructorExtensions {

  public async delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  public getCancelToken(promise: Promise<any>): ICancelAsyncToken {
    return promise ? getCancellableAsyncToken(promise) : undefined;
  }

}

Object.extendPrototype(Promise, PromiseConstructorExtensions.prototype);
declare global { interface PromiseConstructor extends PromiseConstructorExtensions { } }
