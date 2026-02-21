import { chain } from './chain';

describe('chain', () => {
    it('returns undefined when no funcs', () => {
      const c = chain();
      expect(c()).to.be.undefined;
    });

    it('calls single func and returns result', () => {
      const c = chain((a: number, b: number) => a + b);
      expect(c(1, 2)).to.equal(3);
    });

    it('calls all funcs but returns first result', () => {
      let secondCalled = false;
      const c = chain(
        (x: number) => x * 2,
        () => { secondCalled = true; return 99; }
      );
      expect(c(5)).to.equal(10);
      expect(secondCalled).to.be.true;
    });

    it('filters non-functions', () => {
      const c = chain((x: number) => x + 1, null as any, undefined as any);
      expect(c(1)).to.equal(2);
    });
});
