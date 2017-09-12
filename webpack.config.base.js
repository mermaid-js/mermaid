import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

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
        ['env', {
          'targets': {
            'browsers': ['last 3 versions']
          }
        }]
      ],
      plugins: ['lodash']
    }
  }
}

const styleRule = { // load less to string
  test: /\.less$/,
  use: [
    { loader: 'css-to-string-loader' },
    { loader: 'css-loader' },
    { loader: 'less-loader' }
  ]
}

const lessRule = {
  test: /\.less$/,
  use: ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      { loader: 'css-loader' },
      { loader: 'less-loader' }
    ]
  })
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
      rules: [lodashRule, jsRule, styleRule]
    }
  }
}

export const lessConfig = () => {
  return {
    target: 'web',
    entry: {
      'mermaid.default': './src/less/default/mermaid.less',
      'mermaid.dark': './src/less/dark/mermaid.less',
      'mermaid.forest': './src/less/forest/mermaid.less',
      'mermaid.neutral': './src/less/neutral/mermaid.less'
    },
    output: {
      path: path.join(__dirname, './dist/themes'),
      filename: '[name].css'
    },
    module: {
      rules: [lessRule]
    },
    plugins: [
      new ExtractTextPlugin('[name].css')
    ]
  }
}
