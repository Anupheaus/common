import { createSubscriber } from './subscriber';

describe('subscriptions', () => {

  describe('createSubscriber', () => {
    it('invokes callback when subscribed and invoked', () => {
      const { subscribe, invoke } = createSubscriber<(x: number) => number>();
      let received: number | undefined;
      subscribe(x => { received = x; return x * 2; });
      const results = invoke(5);
      expect(received).to.equal(5);
      expect(results).to.deep.equal([10]);
    });

    it('unsubscribe removes callback', () => {
      const { subscribe, invoke } = createSubscriber<(x: number) => void>();
      let count = 0;
      const unsub = subscribe(() => { count++; });
      invoke(1);
      expect(count).to.equal(1);
      unsub();
      invoke(2);
      expect(count).to.equal(1);
    });

    it('invokes all subscribers', () => {
      const { subscribe, invoke } = createSubscriber<(x: string) => string>();
      const results: string[] = [];
      subscribe(x => { results.push('a' + x); return 'a'; });
      subscribe(x => { results.push('b' + x); return 'b'; });
      const ret = invoke('x');
      expect(results).to.deep.equal(['ax', 'bx']);
      expect(ret).to.deep.equal(['a', 'b']);
    });

    it('passes multiple args correctly', () => {
      const { subscribe, invoke } = createSubscriber<(a: number, b: string) => string>();
      let a: number = 0, b: string = '';
      subscribe((x, y) => { a = x; b = y; return y + x; });
      invoke(3, 'hi');
      expect(a).to.equal(3);
      expect(b).to.equal('hi');
    });
  });
});
