import path from 'path'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

const rules = [
  {
    parser: {
      amd: false
    },
    include: /node_modules\/lodash\// // https://github.com/lodash/lodash/issues/3052
  }
]

export const jsConfig = () => {
  return {
    target: 'web',
    entry: {
      mermaid: './src/mermaid.js'
    },
    externals: ['fs'],
    output: {
      path: path.join(__dirname, './dist/'),
      filename: '[name].js',
      library: 'mermaid',
      libraryTarget: 'umd',
      libraryExport: 'default'
    },
    module: {
      rules: rules.concat([
        {
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
      ])
    }
  }
}

export const lessConfig = () => {
  return {
    target: 'web',
    entry: {
      'mermaid': './src/less/default/mermaid.less',
      'mermaid.dark': './src/less/dark/mermaid.less',
      'mermaid.forest': './src/less/forest/mermaid.less',
      'mermaid.neutral': './src/less/neutral/mermaid.less'
    },
    output: {
      path: path.join(__dirname, './dist/'),
      filename: '[name].css'
    },
    module: {
      rules: rules.concat([
        {
          test: /\.less$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: 'css-loader'
              },
              {
                loader: 'less-loader'
              }
            ]
          })
        }
      ])
    },
    plugins: [
      new ExtractTextPlugin('[name].css')
    ]
  }
}
