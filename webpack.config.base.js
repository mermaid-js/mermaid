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
    }
  }
}
