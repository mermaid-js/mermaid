import path from 'path'

const amdRule = {
  parser: {
    amd: false // https://github.com/lodash/lodash/issues/3052
  }
}

const jsRule = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader'
  }
}

const scssRule = { // load scss to string
  test: /\.scss$/,
  use: [
    { loader: 'css-to-string-loader' },
    { loader: 'css-loader' },
    { loader: 'sass-loader' }
  ]
}

export const jsConfig = () => {
  return {
    mode: 'development',
    target: 'web',
    entry: {
      mermaid: './src/mermaid.js'
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
    module: {
      rules: [amdRule, jsRule, scssRule]
    },
    devtool: 'source-map'
  }
}
