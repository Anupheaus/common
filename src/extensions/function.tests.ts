import './function';

describe('extensions', () => {

  describe('function', () => {

    describe('getStackTrace', () => {

      it('correctly returns stack trace information', () => {
        const stackInfo = Function.getStackTrace();
        expect(stackInfo).to.be.an('array').with.lengthOf.at.least(2);
        const currentFrame = stackInfo[0];

        expect(currentFrame).to.have.property('methodName', 'Context.it');
        expect(currentFrame).to.have.property('file').which.is.a('string');
        expect(currentFrame).to.have.property('line').which.is.a('number');
        expect(currentFrame).to.have.property('column').which.is.a('number');
      });

    });

  });

});
