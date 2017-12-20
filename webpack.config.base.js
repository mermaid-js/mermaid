import path from 'path'

const lodashRule = {
  parser: {
    amd: false
  },
  include: /node_modules\/lodash\// // https://github.com/lodash/lodash/issues/3052
}

const jsRule = {
  test: /\.js$/,
  exclude: /node_modules/,
  use: {
    loader: 'babel-loader',
    options: {
      presets: [
        'env'
      ],
      plugins: ['lodash']
    }
  }
}

const lessRule = { // load less to string
  test: /\.less$/,
  use: [
    { loader: 'css-to-string-loader' },
    { loader: 'css-loader' },
    { loader: 'less-loader' }
  ]
}

export const jsConfig = () => {
  return {
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
      rules: [lodashRule, jsRule, lessRule]
    },
    devtool: 'source-map'
  }
}
