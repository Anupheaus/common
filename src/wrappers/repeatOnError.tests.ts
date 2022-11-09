import '../extensions/promise';
import { repeatOnError } from './repeatOnError';

describe('wrappers', () => {

  describe('repeatOnError', () => {

    describe('synchronously', () => {

      it('can work without an error occurring', () => {
        let callCount = 0;
        const result = repeatOnError(() => {
          callCount++;
          return 'result';
        }, { maxAttempts: 3 });

        expect(callCount).to.eq(1);
        expect(result).to.eq('result');
      });

      it('can work with an error occurring', () => {
        let callCount = 0;
        let errorCount = 0;
        const result = repeatOnError(() => {
          callCount++;
          if (errorCount === 0) {
            errorCount++;
            throw new Error('Error raised!');
          }
          return 'result';
        }, { maxAttempts: 3 });

        expect(callCount).to.eq(2);
        expect(errorCount).to.eq(1);
        expect(result).to.eq('result');
      });

      it('can work with an error everytime', () => {
        let callCount = 0;
        let error: Error | undefined;
        let result: string | undefined;
        try {
          result = repeatOnError(() => {
            callCount++;
            throw new Error('Error raised!');
          }, { maxAttempts: 3 });
        } catch (e) {
          error = e as Error;
        }
        expect(callCount).to.eq(3);
        expect(error).to.have.property('message', 'Error raised!');
        expect(result).to.be.undefined;
      });

      it('can work with an onFailure delegate', () => {
        let callCount = 0;
        let error: Error | undefined;
        let result: string | undefined;
        try {
          result = repeatOnError(() => {
            callCount++;
            throw new Error('Error raised!');
          }, { maxAttempts: 3, onFailure: () => 'boo' });
        } catch (e) {
          error = e as Error;
        }
        expect(callCount).to.eq(3);
        expect(error).to.be.undefined;
        expect(result).to.eq('boo');
      });

    });

    describe('asynchronously', () => {

      it('can work without an error occurring', async () => {
        let callCount = 0;
        const result = await repeatOnError(async () => {
          callCount++;
          await Promise.delay(10);
          return 'result';
        }, { maxAttempts: 3 });

        expect(callCount).to.eq(1);
        expect(result).to.eq('result');
      });

      it('can work with an error occurring', async () => {
        let callCount = 0;
        let errorCount = 0;
        const result = await repeatOnError(async () => {
          callCount++;
          await Promise.delay(10);
          if (errorCount === 0) {
            errorCount++;
            throw new Error('Error raised!');
          }
          return 'result';
        }, { maxAttempts: 3 });

        expect(callCount).to.eq(2);
        expect(errorCount).to.eq(1);
        expect(result).to.eq('result');
      });

      it('can work with an error everytime', async () => {
        let callCount = 0;
        let error: Error | undefined;
        let result: string | undefined;
        try {
          result = await repeatOnError(async () => {
            callCount++;
            await Promise.delay(10);
            throw new Error('Error raised!');
          }, { maxAttempts: 3 });
        } catch (e) {
          error = e as Error;
        }
        expect(callCount).to.eq(3);
        expect(error).to.have.property('message', 'Error raised!');
        expect(result).to.be.undefined;
      });

      it('can work with an onFailure delegate', async () => {
        let callCount = 0;
        let error: Error | undefined;
        let result: string | undefined;
        try {
          result = await repeatOnError(async () => {
            callCount++;
            await Promise.delay(10);
            throw new Error('Error raised!');
          }, { maxAttempts: 3, onFailure: () => Promise.resolve('boo') });
        } catch (e) {
          error = e as Error;
        }
        expect(callCount).to.eq(3);
        expect(error).to.be.undefined;
        expect(result).to.eq('boo');
      });

    });

  });

});