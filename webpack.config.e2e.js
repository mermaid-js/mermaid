const path = require('path')

const jsRule = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader'
  }
}

const amdRule = {
  parser: {
    amd: false // https://github.com/lodash/lodash/issues/3052
  }
}
const scssRule = {
  // load scss to string
  test: /\.scss$/,
  use: [
    { loader: 'css-to-string-loader' },
    { loader: 'css-loader' },
    { loader: 'sass-loader' }
  ]
}

module.exports = {
  mode: 'development',
  target: 'web',
  entry: {
    mermaid: './src/mermaid.js',
    e2e: './e2e/platform/viewer.js',
    'bundle-test': './e2e/platform/bundle-test.js'
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
    contentBase: [
      path.join(__dirname, 'e2e', 'platform'),
      path.join(__dirname, 'dist')
    ],
    compress: true,
    port: 9000
  },
  module: {
    rules: [amdRule, jsRule, scssRule]
  },
  externals: {
    mermaid: 'mermaid'
  },
  devtool: 'source-map'
}
