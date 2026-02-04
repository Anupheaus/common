// tslint:disable:no-console
import '../extensions/promise';
import type { PromiseMaybe } from '../extensions';
import { Event } from './Event';

function createEvent() {
  return Event.create<(something: string) => PromiseMaybe>();
}

describe('events', () => {

  describe('Event', () => {

    it('can be invoked', () => {
      const a = createEvent();
      let result: string | undefined;
      a(something => { result = something; });
      expect(result).to.be.undefined;
      Event.raise(a, 'hey');
      expect(result).to.eq('hey');
      Event.dispose(a);
    });

    it('only calls the subscribers once each invocation', () => {
      const a = createEvent();
      let count = 0;
      a(() => { count++; });
      expect(count).to.eq(0);
      Event.raise(a, 'hey');
      expect(count).to.eq(1);
      Event.raise(a, 'again');
      expect(count).to.eq(2);
      Event.dispose(a);
    });

    it('works asynchronously', async () => {
      const a = createEvent();
      let count = 0;
      a(async () => {
        await Promise.delay(1);
        count++;
      });
      expect(count).to.eq(0);
      const promise = Event.raise(a, 'hey');
      expect(count).to.eq(0);
      await promise;
      expect(count).to.eq(1);
      await Event.raise(a, 'again');
      expect(count).to.eq(2);
      Event.dispose(a);
    });

    it('handles subscriptions being disposed during handling an event', async () => {
      const a = createEvent();
      let unsub2Called = false;
      let canUnsubscribe2Now = false;
      a(() => {
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (canUnsubscribe2Now) { unsub2(); }
      });
      const unsub2 = a(() => { unsub2Called = true; });
      expect(unsub2Called).to.be.false;
      Event.raise(a, 'test');
      expect(unsub2Called).to.be.true;
      unsub2Called = false;
      canUnsubscribe2Now = true;
      expect(unsub2Called).to.be.false;
      Event.raise(a, 'test');
      expect(unsub2Called).to.be.false;
      Event.dispose(a);
    });

    it('will not error and will do nothing if a subscription\'s unsubscribe is called more than once', () => {
      const a = createEvent()
      const unsub = a(() => void 0);
      unsub();
      expect(() => unsub()).not.to.throw();
    });

    it('does not error if the unsubscribe is called after being disposed', () => {
      const a = createEvent()
      const unsub = a(() => void 0);
      Event.dispose(a);
      expect(() => unsub()).not.to.throw();
    });

    it('errors if it has been disposed and we try and subscribe to it', () => {
      const a = createEvent();
      Event.dispose(a);
      expect(() => a(() => void 0)).to.throw();
    });

    it('errors if it has been disposed and we try and invoke it', () => {
      const a = createEvent();
      Event.dispose(a);
      expect(() => Event.raise(a, 'fdfd')).to.throw();
    });

    it('errors if it has been disposed and we try and dispose of it again', () => {
      const a = createEvent();
      Event.dispose(a);
      expect(() => Event.dispose(a)).to.throw();
    });

    it('can be enabled and disabled', () => {
      const a = createEvent();
      let subscriberCalled = false;
      a(() => { subscriberCalled = true; });
      Event.disable(a);
      Event.raise(a, 'fdfd');
      expect(subscriberCalled).to.be.false;
      Event.enable(a);
      Event.raise(a, 'fdfd');
      expect(subscriberCalled).to.be.true;
      Event.dispose(a);
    });

    it('can dispose of multiple events at the same time', () => {
      const a = createEvent();
      const b = createEvent();
      expect(() => Event.raise(a, 'hey')).not.to.throw();
      expect(() => Event.raise(b, 'hey')).not.to.throw();
      Event.dispose(a, b);
      expect(() => Event.raise(a, 'hey')).to.throw();
      expect(() => Event.raise(b, 'hey')).to.throw();
    });

  });

});