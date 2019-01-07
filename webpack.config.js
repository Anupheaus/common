const { CheckerPlugin } = require('awesome-typescript-loader')
const nodeExternals = require('webpack-node-externals');

module.exports = {
  target: 'node',
  devtool: 'source-map',
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
    new CheckerPlugin()
  ],
};