module.exports = {
  require: [
    'tsx/cjs',
    './tests/test-setup.js',
  ],
  spec: './src/**/*.tests.+(ts|tsx)',
  watchFiles: [
    './src/**/*.+(ts|tsx)'
  ],
};
