import './object';

// tslint:disable:interface-name

class PromiseExtensions {

  public async delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

}

Object.extendPrototype(Promise, PromiseExtensions.prototype);
declare global { interface PromiseConstructor extends PromiseExtensions { } }
