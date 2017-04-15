import path from 'path'

const config = {
  target: 'web',
  entry: {
    mermaid: './src/mermaid.js',
    mermaidAPI: './src/mermaidAPI.js'
  },
  externals: ['fs', 'd3'],
  output: {
    path: path.join(__dirname, './dist/'),
    filename: '[name].slim.min.js'
  }
}

export default [config]
