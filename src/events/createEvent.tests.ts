// tslint:disable:no-console
import '../extensions/promise';
import { createEvent, Unsubscribe } from './createEvent';
import { PromiseMaybe } from '../extensions';

class EventTesting {

  private _event = createEvent<(something: string) => PromiseMaybe>();

  public get subscribe() { return this._event.subscribe; }

  public invoke(something: string): PromiseMaybe {
    return this._event.invoke(something);
  }

  public dispose(): void {
    this._event.dispose();
  }

}

describe('createEvent', () => {

  it('can be invoked', () => {
    const a = new EventTesting();
    let result: string;
    a.subscribe(something => { result = something; });
    expect(result).to.be.undefined;
    a.invoke('hey');
    expect(result).to.eq('hey');
    a.dispose();
  });

  it('only calls the subscribers once each invocation', () => {
    const a = new EventTesting();
    let count = 0;
    a.subscribe(() => { count++; });
    expect(count).to.eq(0);
    a.invoke('hey');
    expect(count).to.eq(1);
    a.invoke('again');
    expect(count).to.eq(2);
    a.dispose();
  });

  it('works asynchronously', async () => {
    const a = new EventTesting();
    let count = 0;
    a.subscribe(async () => {
      await Promise.delay(1);
      count++;
    });
    expect(count).to.eq(0);
    const promise = a.invoke('hey');
    expect(count).to.eq(0);
    await promise;
    expect(count).to.eq(1);
    await a.invoke('again');
    expect(count).to.eq(2);
    a.dispose();
  });

  it('handles subscriptions being disposed during handling an event', async () => {
    const a = new EventTesting();
    let unsub2: Unsubscribe;
    let unsub2Called = false;
    let canUnsubscribe2Now = false;
    a.subscribe(() => { if (canUnsubscribe2Now) { unsub2(); } });
    unsub2 = a.subscribe(() => { unsub2Called = true; });
    expect(unsub2Called).to.be.false;
    a.invoke('test');
    expect(unsub2Called).to.be.true;
    unsub2Called = false;
    canUnsubscribe2Now = true;
    expect(unsub2Called).to.be.false;
    a.invoke('test');
    expect(unsub2Called).to.be.false;
    a.dispose();
  });

  it('will not error and will do nothing if a subscription\'s unsubscribe is called more than once', () => {
    const a = new EventTesting();
    const unsub = a.subscribe(() => void 0);
    unsub();
    expect(() => unsub()).not.to.throw();
  });

  it('does not error if the unsubscribe is called after being disposed', () => {
    const a = new EventTesting();
    const unsub = a.subscribe(() => void 0);
    a.dispose();
    expect(() => unsub()).not.to.throw();
  });

  it('errors if it has been disposed and we try and subscribe to it', () => {
    const a = new EventTesting();
    a.dispose();
    expect(() => a.subscribe(() => void 0)).to.throw();
  });

  it('errors if it has been disposed and we try and invoke it', () => {
    const a = new EventTesting();
    a.dispose();
    expect(() => a.invoke('fdfd')).to.throw();
  });

  it('errors if it has been disposed and we try and dispose of it again', () => {
    const a = new EventTesting();
    a.dispose();
    expect(() => a.dispose()).to.throw();
  });

});
