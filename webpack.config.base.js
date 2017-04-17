import path from 'path'
import nodeExternals from 'webpack-node-externals'

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
