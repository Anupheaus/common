const { CheckerPlugin } = require('awesome-typescript-loader')
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  target: 'node',
  devtool: 'source-map',
  entry: {
    index: './src/index.ts',
  },
  output: {
    libraryTarget: 'umd',
    umdNamedDefine: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'awesome-typescript-loader'
      }
    ]
  },
  externals: [nodeExternals()],
  plugins: [
    new CleanWebpackPlugin(['dist']),
    new CheckerPlugin(),
    new CopyWebpackPlugin([
      { from: './src/extensions/global.ts', to: './extensions', },
    ]),
  ],
};