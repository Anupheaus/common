import './function';

describe.only('extensions', () => {

  describe('function', () => {

    describe('getStackTrace', () => {

      it('correctly returns stack trace information', () => {
        const stackInfo = Function.getStackTrace();
        expect(stackInfo).to.be.an('array').with.lengthOf(9);
        const currentFrame = stackInfo[0];
        expect(currentFrame).to.eql({
          methodName: 'Context.it',
          file: 'C:\\Users\\tony.hales\\.vscode\\extensions\\wallabyjs.wallaby-vscode-1.0.136\\projects\\c95feb84ff8e9c02\\instrumented\\src\\extensions\\function.tests.js',
          line: 13,
          column: 58,
        });
      });

    });

  });

});
