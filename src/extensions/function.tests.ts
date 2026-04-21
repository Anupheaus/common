import './function';

class WrapTestSubject {
  public count = 0;
  public increment(): number { return ++this.count; }
  public greet(): string { return 'hello'; }
}

describe('extensions', () => {

  describe('function', () => {

    describe('getStackTrace', () => {

      it('correctly returns stack trace information', () => {
        const stackInfo = Function.getStackTrace();
        expect(stackInfo).to.be.an('array').with.lengthOf.at.least(2);
        const currentFrame = stackInfo[0];

        expect(currentFrame).to.have.property('methodName', 'Context.<anonymous>');
        expect(currentFrame).to.have.property('file').which.is.a('string');
        expect(currentFrame).to.have.property('line').which.is.a('number');
        expect(currentFrame).to.have.property('column').which.is.a('number');
      });

    });

    describe('setName', () => {

      it('renames a function', () => {
        const fn = function original() { /* */ };
        fn.setName('renamed');
        expect(fn.name).to.equal('renamed');
      });

      it('returns the same function instance', () => {
        const fn = function foo() { /* */ };
        const result = fn.setName('bar');
        expect(result).to.equal(fn);
      });

    });

    describe('empty', () => {

      it('returns a function that returns undefined', () => {
        const emptyFn = (function myFn() { /* */ }).empty();
        expect(emptyFn).to.be.a('function');
        expect(emptyFn()).to.be.undefined;
      });

      it('always returns the same no-op instance', () => {
        const a = (function a() { /* */ }).empty();
        const b = (function b() { /* */ }).empty();
        expect(a).to.equal(b);
      });

    });

    describe('emptyAsync', () => {

      it('returns a function that returns a resolved Promise', async () => {
        const fn = (function myFn() { /* */ }).emptyAsync();
        expect(fn).to.be.a('function');
        const result = await fn();
        expect(result).to.be.undefined;
      });

      it('always returns the same no-op async instance', () => {
        const a = (function a() { /* */ }).emptyAsync();
        const b = (function b() { /* */ }).emptyAsync();
        expect(a).to.equal(b);
      });

    });

    describe('wrap', () => {

      it('intercepts method calls and allows calling through to the original', () => {
        const c = new WrapTestSubject();
        WrapTestSubject.prototype.increment.wrap(c, (args, next) => {
          return (next(args) as number) * 10;
        });

        expect(c.increment()).to.equal(10);
        expect(c.count).to.equal(1);
      });

      it('allows blocking the original method', () => {
        const g = new WrapTestSubject();
        WrapTestSubject.prototype.greet.wrap(g, (_args, _next) => 'intercepted');

        expect(g.greet()).to.equal('intercepted');
      });

    });

  });

});
