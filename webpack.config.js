import path from 'path'

const config = {
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

export default [config]
