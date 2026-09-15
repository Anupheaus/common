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

  it('awaiting the debounced function waits for func to complete', async () => {
    let completed = false;
    const fn = debounce(async () => {
      await Promise.delay(20);
      completed = true;
    }, 10);
    await fn();
    expect(completed).to.be.true;
  });

  it('errors from func propagate through the returned promise', async () => {
    const fn = debounce(async () => {
      throw new Error('boom');
    }, 10);
    let caught: unknown;
    try {
      await fn();
    } catch (err) {
      caught = err;
    }
    expect(caught).to.be.instanceOf(Error);
    expect((caught as Error).message).to.equal('boom');
  });

  it('a superseded call resolves without error', async () => {
    let execCount = 0;
    const fn = debounce(async () => {
      execCount++;
    }, 50);
    const p1 = fn();
    const p2 = fn();
    // p1 was superseded by p2 — both should resolve cleanly
    await Promise.all([p1, p2]);
    expect(execCount).to.equal(1);
  });

  it('cancel prevents a pending call from executing', async () => {
    let called = false;
    const fn = debounce(() => { called = true; }, 20);
    fn();
    fn.cancel();
    await Promise.delay(40);
    expect(called).to.be.false;
  });

  it('cancel resolves the pending promise cleanly without running func', async () => {
    let called = false;
    const fn = debounce(() => { called = true; }, 20);
    const p = fn();
    fn.cancel();
    await p; // must resolve rather than hang or reject
    expect(called).to.be.false;
  });

  it('cancel is a no-op when nothing is pending', () => {
    const fn = debounce(() => {}, 20);
    expect(() => fn.cancel()).to.not.throw();
  });

  it('can debounce again after cancel', async () => {
    let count = 0;
    const fn = debounce(() => count++, 20);
    fn();
    fn.cancel();
    fn();
    await Promise.delay(40);
    expect(count).to.equal(1);
  });
});
