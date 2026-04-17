import { CancellationToken } from './cancellationToken';

describe('cancellationToken', () => {

  it('can be created', () => {
    const token = CancellationToken.create();
    expect(token).to.be.an('object');
    expect(token.cancel).to.be.a('function');
    expect(token.dispose).to.be.a('function');
    expect(token.onCancelled).to.be.a('function');
    expect(token.isCancelled).to.be.a('boolean');
    expect(token.reason).to.be.undefined;
  });

  it('can be cancelled', () => {
    const token = CancellationToken.create();
    expect(token.isCancelled).to.be.false;
    token.cancel('my reason');
    expect(token.isCancelled).to.be.true;
    expect(token.reason).to.eq('my reason');
  });

  it('calls the callbacks when cancelled', () => {
    const token = CancellationToken.create();
    let onCancelledCallCount = 0;
    let reason: string | undefined;
    token.onCancelled(r => {
      onCancelledCallCount++;
      reason = r;
    });
    expect(reason).to.be.undefined;
    expect(onCancelledCallCount).to.eq(0);
    token.cancel('my reason');
    expect(reason).to.eq('my reason');
    expect(onCancelledCallCount).to.eq(1);
  });

  it('can be disposed and will not call callbacks if cancelled after dispose', () => {
    const token = CancellationToken.create();
    let onCancelledCallCount = 0;
    let reason: string | undefined;
    token.onCancelled(r => {
      onCancelledCallCount++;
      reason = r;
    });
    expect(reason).to.be.undefined;
    expect(onCancelledCallCount).to.eq(0);
    token.dispose();
    token.cancel('my reason');
    expect(reason).to.be.undefined;
    expect(onCancelledCallCount).to.eq(0);
  });

  it('calls callbacks immediately if already cancelled', () => {
    const token = CancellationToken.create();
    let onCancelledCallCount = 0;
    let reason: string | undefined;
    token.cancel('my reason');
    expect(reason).to.be.undefined;
    expect(onCancelledCallCount).to.eq(0);
    token.onCancelled(r => {
      onCancelledCallCount++;
      reason = r;
    });
    expect(reason).to.eq('my reason');
    expect(onCancelledCallCount).to.eq(1);
  });

  it('does not add callbacks if disposed', () => {
    const token = CancellationToken.create();
    expect(token['_callbacks']).to.have.lengthOf(0);
    token.dispose();
    token.onCancelled(() => void 0);
    expect(token['_callbacks']).to.have.lengthOf(0);
  });

  it('second cancel call is ignored — first reason wins', () => {
    const token = CancellationToken.create();
    token.cancel('first');
    token.cancel('second');
    expect(token.isCancelled).to.be.true;
    expect(token.reason).to.equal('first');
  });

  it('onCancelled fires immediately when token is already cancelled', () => {
    const token = CancellationToken.create();
    token.cancel('done');
    let called = false;
    token.onCancelled(() => { called = true; });
    expect(called).to.be.true;
  });

  it('all onCancelled callbacks fire on cancel', () => {
    const token = CancellationToken.create();
    let count = 0;
    token.onCancelled(() => count++);
    token.onCancelled(() => count++);
    token.onCancelled(() => count++);
    token.cancel();
    expect(count).to.equal(3);
  });

  it('onCancelled returns false after token is disposed', () => {
    const token = CancellationToken.create();
    token.dispose();
    const result = token.onCancelled(() => { /* noop */ });
    expect(result).to.be.false;
  });

});
