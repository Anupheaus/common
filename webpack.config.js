const path = require('path');
const root = process.cwd();
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');
const CircularDependencyPlugin = require('circular-dependency-plugin');

module.exports = {
  entry: { index: './src/index.ts' },
  devtool: 'source-map',
  target: 'node',
  output: {
    path: path.resolve(root, './dist'),
    libraryTarget: 'umd',
    library: 'anux-common',
    globalObject: 'globalThis',
    clean: true,
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: {
        onlyCompileBundledFiles: true,
        compilerOptions: {
          noEmit: false,
          declaration: false,
          declarationMap: false,
        },
      },
    }, {
      test: /\.js$/,
      use: ['source-map-loader'],
      enforce: 'pre'
    }],
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          compress: true,
          keep_classnames: true,
          keep_fnames: true,
          sourceMap: true,
        },
      }),
    ],
  },
  externals: [
    nodeExternals(),
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  plugins: [
    new CircularDependencyPlugin({
      exclude: /node_modules/,
      failOnError: false,
      allowAsyncCycles: false,
      cwd: root,
      onDetected({ paths }) {
        console.warn('\n⚠ Circular dependency detected:\n  ' + paths.join(' -> ') + '\n');
      },
    }),
  ],
  stats: {
    assets: false,
    builtAt: false,
    cached: false,
    cachedAssets: false,
    children: false,
    chunks: false,
    chunkGroups: false,
    chunkModules: false,
    chunkOrigins: false,
    colors: true,
    depth: false,
    entrypoints: false,
    env: false,
    errors: true,
    errorDetails: true,
    hash: false,
    logging: 'error',
    modules: false,
    outputPath: false,
    performance: true,
    providedExports: false,
    publicPath: false,
    reasons: false,
    source: false,
    timings: true,
    usedExports: false,
    version: true,
    warnings: true,
  },
};
