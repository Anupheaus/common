module.exports = function () {
  return {
    name: 'Anux - Common',
    files: [
      '!src/**/*.tests.ts?(x)',
      { pattern: 'test-utils/**/*.ts?(x)', load: false },
      { pattern: 'src/**/*.ts?(x)', load: false },
    ],
    tests: [
      { pattern: 'src/**/*.tests.ts?(x)' },
    ],
    testFramework: 'mocha',
    env: {
      type: 'node',
    },
    workers: {
      initial: 6,
      regular: 3,
    },
    setup() {
      const chai = require('chai');
      const spies = require('chai-spies');
      const fuzzy = require('chai-fuzzy');

      chai.use(spies);
      chai.use(fuzzy);

      global['chai'] = chai;
      global['expect'] = chai.expect;
    }
  };
}
