import path from 'path'
import nodeExternals from 'webpack-node-externals'
import ExtractTextPlugin from 'extract-text-webpack-plugin'

export const webConfig = () => {
  return {
    target: 'web',
    entry: {
      mermaid: './src/mermaid.js'
    },
    externals: 'fs',
    output: {
      path: path.join(__dirname, './dist/'),
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
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
              plugins: [
                'transform-remove-strict-mode'
              ]
            }
          }
        }
      ]
    }
  }
}

export const nodeConfig = () => {
  return {
    target: 'node',
    entry: {
      mermaidAPI: './src/mermaidAPI.js'
    },
    externals: [nodeExternals()],
    output: {
      path: path.join(__dirname, './dist/'),
      filename: '[name].js',
      libraryTarget: 'commonjs2'
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['env', {
                  'targets': {
                    'node': 4.2
                  }
                }]
              ]
            }
          }
        }
      ]
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
      rules: [
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
      ]
    },
    plugins: [
      new ExtractTextPlugin('[name].css')
    ]
  }
}
