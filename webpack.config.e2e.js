const path = require('path');

const jsRule = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader'
  }
};

const jisonRule = {
  test: /\.jison$/,
  use: {
    loader: path.resolve(__dirname, './jisonLoader'),
    options: {
      'token-stack': true
    }
  }
};

const amdRule = {
  parser: {
    amd: false // https://github.com/lodash/lodash/issues/3052
  }
};
const scssRule = {
  // load scss to string
  test: /\.scss$/,
  use: [{ loader: 'css-to-string-loader' }, { loader: 'css-loader' }, { loader: 'sass-loader' }]
};

module.exports = {
  mode: 'development',
  target: 'web',
  entry: {
    mermaid: './src/mermaid.js',
    e2e: './cypress/platform/viewer.js',
    'bundle-test': './cypress/platform/bundle-test.js'
  },
  resolve: {
    extensions: ['.wasm', '.mjs', '.js', '.json', '.jison']
  },
  node: {
    fs: 'empty' // jison generated code requires 'fs'
  },
  output: {
    path: path.join(__dirname, './dist/'),
    filename: '[name].js',
    library: 'mermaid',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  devServer: {
    contentBase: [path.join(__dirname, 'cypress', 'platform'), path.join(__dirname, 'dist')],
    compress: true,
    port: 9000
  },
  module: {
    rules: [amdRule, jsRule, scssRule, jisonRule]
  },
  externals: {
    mermaid: 'mermaid'
  },
  devtool: 'source-map'
};
