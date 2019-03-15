// tslint:disable:interface-name
import './object';

class PromiseConstructorExtensions {

  public async delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

}

Object.extendPrototype(Promise, PromiseConstructorExtensions.prototype);
declare global { interface PromiseConstructor extends PromiseConstructorExtensions { } }
