module.exports = {
  require: [
    './tests/test-setup.js',
  ],
  import: 'tsx',
  spec: './src/**/*.tests.+(ts|tsx)',
  watchFiles: [
    './src/**/*.+(ts|tsx)'
  ],
};
