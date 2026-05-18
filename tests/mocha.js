module.exports = {
  import: ['tsx', './tests/test-setup.mjs'],
  spec: './src/**/*.tests.+(ts|tsx)',
  watchFiles: [
    './src/**/*.+(ts|tsx)'
  ],
};
