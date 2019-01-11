import './object';

class PromiseExtensions {

  public async delay(ms: number): Promise<void> {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

}

// tslint:disable-next-line:interface-name
declare global { interface PromiseConstructor extends PromiseExtensions { } }
Object.extendPrototype(Promise, PromiseExtensions.prototype);
