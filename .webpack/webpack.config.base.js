import path from 'path';
const { TsConfigPathsPlugin } = require('awesome-typescript-loader');
export const resolveRoot = (...relativePath) => path.resolve(__dirname, '..', ...relativePath);

export default {
  amd: false, // https://github.com/lodash/lodash/issues/3052
  target: 'web',
  entry: {
    mermaid: './src/mermaid.ts',
  },
  resolve: {
    extensions: ['.wasm', '.mjs', '.js', '.ts', '.json', '.jison'],
    fallback: {
      fs: false, // jison generated code requires 'fs'
      path: require.resolve('path-browserify'),
    },
    plugins: [new TsConfigPathsPlugin()],
  },
  output: {
    path: resolveRoot('./dist'),
    filename: '[name].js',
    library: {
      name: 'mermaid',
      type: 'umd',
      export: 'default',
    },
    globalObject: 'typeof self !== "undefined" ? self : this',
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        include: [resolveRoot('./src'), resolveRoot('./node_modules/dagre-d3-renderer/lib')],
        use: {
          loader: 'babel-loader',
        },
      },
      {
        // load scss to string
        test: /\.scss$/,
        use: ['css-to-string-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.jison$/,
        use: {
          loader: path.resolve(__dirname, './loaders/jison.js'),
          options: {
            'token-stack': true,
          },
        },
      },
    ],
  },
  devtool: 'source-map',
};
