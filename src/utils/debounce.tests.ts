import '../extensions/promise';
import { debounce } from './debounce';

describe('debounce', () => {
    it('calls func after timeout', async () => {
      let called = false;
      const fn = debounce(() => { called = true; }, 10);
      fn();
      expect(called).to.be.false;
      await Promise.delay(15);
      expect(called).to.be.true;
    });

    it('resets on rapid calls and only last executes', async () => {
      let count = 0;
      const fn = debounce(() => count++, 50);
      fn();
      fn();
      fn();
      await Promise.delay(30);
      expect(count).to.equal(0);
      await Promise.delay(30);
      expect(count).to.equal(1);
    });

    it('returns Promise', async () => {
      const fn = debounce(() => {}, 10);
      const p = fn();
      expect(p).to.be.instanceOf(Promise);
      await p;
    });
});
