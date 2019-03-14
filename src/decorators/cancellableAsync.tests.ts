import '../extensions/promise';
import { cancellableAsync, ICancelAsyncToken } from './cancellableAsync';

class TestCancellableAsync {

  public async testMethod(): Promise<boolean>;
  @cancellableAsync
  public async testMethod(token?: ICancelAsyncToken): Promise<boolean> {
    await Promise.delay(10);
    return token.isCancelled;
  }

}

it('can cancel a class method using a decorator', async () => {
  const asyncTestClass = new TestCancellableAsync();
  const promise = asyncTestClass.testMethod();
  const token = Promise.getCancelToken(promise);
  expect(token).to.be.an('object');
  token.cancel();
  const wasCancelled = await promise;
  expect(wasCancelled).to.be.true;
});

it('can cancel a function using the cancellableAsync method', async () => {

  const testAsyncFunction = cancellableAsync(innerToken => async (testParam: number) => {
    await Promise.delay(10);
    return [innerToken.isCancelled, testParam];
  });

  const promise = testAsyncFunction(4);
  const token = Promise.getCancelToken(promise);
  expect(token).to.be.an('object');
  token.cancel();
  const result = await promise;
  expect(result).to.eql([true, 4]);
});

it('calls the onCancelled delegates whether inside or outside the function', async () => {
  let insideDelegateCalled = false;
  let outsideDelegateCalled = false;

  const testAsyncFunction = cancellableAsync(innerToken => async () => {
    innerToken.onCancelled(() => { insideDelegateCalled = true; });
    await Promise.delay(1);
  });

  expect(insideDelegateCalled).to.be.false;
  expect(outsideDelegateCalled).to.be.false;
  const promise = testAsyncFunction();
  const token = Promise.getCancelToken(promise);
  token.onCancelled(() => { outsideDelegateCalled = true; });
  expect(token).to.be.an('object');
  token.cancel();
  expect(insideDelegateCalled).to.be.true;
  expect(outsideDelegateCalled).to.be.true;
});
