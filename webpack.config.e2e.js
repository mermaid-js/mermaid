const path = require('path');

const jsRule = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
  },
};

const jisonRule = {
  test: /\.jison$/,
  use: {
    loader: path.resolve(__dirname, './jisonLoader'),
    options: {
      'token-stack': true,
    },
  },
};

const scssRule = {
  // load scss to string
  test: /\.scss$/,
  use: [{ loader: 'css-to-string-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }],
};

module.exports = {
  amd: false, // https://github.com/lodash/lodash/issues/3052
  mode: 'development',
  target: 'web',
  entry: {
    mermaid: './src/mermaid.js',
    e2e: './cypress/platform/viewer.js',
    'bundle-test': './cypress/platform/bundle-test.js',
  },
  resolve: {
    extensions: ['.wasm', '.mjs', '.js', '.json', '.jison'],
    fallback: {
      fs: false, // jison generated code requires 'fs'
      path: require.resolve('path-browserify'),
    },
  },
  output: {
    path: path.join(__dirname, './dist/'),
    filename: '[name].js',
    library: {
      name: 'mermaid',
      type: 'umd',
      export: 'default',
    },
  },
  devServer: {
    compress: true,
    port: 9000,
    static: [
      { directory: path.join(__dirname, 'cypress', 'platform') },
      { directory: path.join(__dirname, 'dist') },
    ],
  },
  module: {
    rules: [jsRule, scssRule, jisonRule],
  },
  externals: {
    mermaid: 'mermaid',
  },
  devtool: 'source-map',
};
