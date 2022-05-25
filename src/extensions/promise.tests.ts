import { PromiseState } from './promise';
import './date_old';

describe('promise', () => {

  describe('delay', () => {

    it('can cause a delay', async () => {
      const timeStarted = Date.now();
      await Promise.delay(6);
      expect(Date.timeTaken(timeStarted)).to.be.at.least(5);
    });

  });

  describe('deferredPromise', () => {

    it('can be created', () => {
      const deferred = Promise.createDeferred();
      expect(deferred).to.be.instanceOf(Promise);
      expect(deferred).to.have.property('state', PromiseState.Pending);
      expect(deferred).to.have.property('resolve').and.to.be.a('function');
      expect(deferred).to.have.property('reject').and.to.be.a('function');
    });

    it('can be resolved', async () => {
      const deferred = Promise.createDeferred<string>();
      expect(deferred.state).to.eq(PromiseState.Pending);
      await Promise.delay(10);
      expect(deferred.state).to.eq(PromiseState.Pending);
      deferred.resolve('Hey there!');
      expect(deferred.state).to.eq(PromiseState.Fulfilled);
      const result = await deferred;
      expect(result).to.eq('Hey there!');
    });

    it('can be waited to be resolved', async () => {
      const deferred = Promise.createDeferred<string>();
      expect(deferred.state).to.eq(PromiseState.Pending);
      const startTime = Date.now();
      setTimeout(() => deferred.resolve('Hey there!'), 6);
      await expect(deferred).to.eventually.eq('Hey there!');
      expect(deferred.state).to.eq(PromiseState.Fulfilled);
      expect(Date.timeTaken(startTime)).to.be.greaterThan(4);
    });

    it('can be rejected', async () => {
      const deferred = Promise.createDeferred<string>();
      expect(deferred.state).to.eq(PromiseState.Pending);
      await Promise.delay(1);
      expect(deferred.state).to.eq(PromiseState.Pending);
      let result: unknown;
      deferred.catch(res => { result = res; return res; });
      deferred.reject(new Error('Hey there!'));
      expect(deferred.state).to.eq(PromiseState.Rejected);
      await Promise.delay(1);
      expect(result).to.be.instanceOf(Error);
      expect(deferred).is.rejectedWith('Hey there!');
    });

    it('can be waited to be rejected', async () => {
      const deferred = Promise.createDeferred<string>();
      expect(deferred.state).to.eq(PromiseState.Pending);
      const startTime = Date.now();
      setTimeout(() => deferred.reject(new Error('Hey there!')), 6);
      await expect(deferred).to.eventually.be.rejectedWith('Hey there!');
      expect(deferred.state).to.eq(PromiseState.Rejected);
      expect(Date.timeTaken(startTime)).to.be.greaterThan(4);
    });

    it('cannot be rejected after being resolved', async () => {
      const deferred = Promise.createDeferred<string>();
      expect(deferred.state).to.eq(PromiseState.Pending);
      const startTime = Date.now();
      setTimeout(() => deferred.resolve('Success!'), 6);
      await expect(deferred).to.eventually.be.eq('Success!');
      expect(deferred.state).to.eq(PromiseState.Fulfilled);
      expect(Date.timeTaken(startTime)).to.be.greaterThan(4);
      deferred.reject(new Error('Failure!'));
      expect(deferred.state).to.eq(PromiseState.Fulfilled);
      expect(await deferred).to.eq('Success!');
    });

    it('cannot be resolved after being resolved', async () => {
      const deferred = Promise.createDeferred<string>();
      expect(deferred.state).to.eq(PromiseState.Pending);
      const startTime = Date.now();
      setTimeout(() => deferred.reject(new Error('Failure!')), 6);
      await expect(deferred).to.eventually.be.rejectedWith('Failure!');
      expect(deferred.state).to.eq(PromiseState.Rejected);
      expect(Date.timeTaken(startTime)).to.be.greaterThan(4);
      deferred.resolve('Success!');
      await expect(deferred).to.eventually.be.rejectedWith('Failure!');
    });

    it('can be successfully chained', async () => {
      const results: number[] = [];
      const waitPoint1 = Promise.createDeferred();
      const waitPoint2 = Promise.createDeferred();
      const deferred = Promise.createDeferred();
      deferred.then(async () => {
        results.push(1);
        await Promise.delay(10);
      }).then(() => {
        results.push(2);
        waitPoint1.resolve();
        return new Promise(resolve => setTimeout(resolve, 10));
      }).then(() => {
        results.push(3);
        waitPoint2.resolve();
      });
      expect(results).to.eql([]);
      const startTime = Date.now();
      deferred.resolve();
      await Promise.delay(1);
      expect(results).to.eql([1]);
      await waitPoint1;
      expect(results).to.eql([1, 2]);
      await waitPoint2;
      expect(results).to.eql([1, 2, 3]);
      expect(Date.timeTaken(startTime)).to.be.greaterThan(18);
    });

  });

});
