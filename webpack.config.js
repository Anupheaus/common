const path = require('path');
const root = process.cwd();
const nodeExternals = require('webpack-node-externals');
const TerserPlugin = require('terser-webpack-plugin');

const isDev = false;

module.exports = {
  entry: { index: './src/index.ts' },
  devtool: 'source-map',
  target: 'node',
  output: {
    path: path.resolve(root, './dist'),
    libraryTarget: 'umd',
    library: 'anux-common',
  },
  module: {
    rules: [{
      test: /\.tsx?$/,
      loader: 'ts-loader',
      options: {
        onlyCompileBundledFiles: true,
        compilerOptions: {
          declaration: true,
          declarationDir: './dist',
          noEmit: false,
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
          compress: !isDev,
          keep_classnames: true,
          keep_fnames: true,
          mangle: !isDev,
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
  stats: {
    assets: false,
    builtAt: isDev,
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
    version: false,
    warnings: false,
  },
};