import path from 'path'

const config = {
  target: 'web',
  entry: {
    mermaid: './src/mermaid.js',
    mermaidAPI: './src/mermaidAPI.js'
  },
  externals: 'fs',
  output: {
    path: path.join(__dirname, './dist/'),
    filename: '[name].min.js'
  }
}

export default [config]
