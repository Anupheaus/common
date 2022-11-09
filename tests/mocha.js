module.exports = {
  require: [
    'ts-node/register',
    './tests/test-setup.js',
  ],
  spec: './src/**/*.tests.+(ts|tsx)',
  watchFiles: [
    './src/**/*.+(ts|tsx)'
  ],
};
