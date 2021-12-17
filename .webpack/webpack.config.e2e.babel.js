import baseConfig, { resolveRoot } from './webpack.config.base';
import { merge } from 'webpack-merge';

export default merge(baseConfig, {
  mode: 'development',
  entry: {
    mermaid: './src/mermaid.js',
    e2e: './cypress/platform/viewer.js',
    'bundle-test': './cypress/platform/bundle-test.js',
  },
  output: {
    globalObject: 'window',
  },
  devServer: {
    compress: true,
    port: 9000,
    static: [
      { directory: resolveRoot('cypress', 'platform') },
      { directory: resolveRoot('dist') },
      { directory: resolveRoot('demos') },
    ],
  },
  externals: {
    mermaid: 'mermaid',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        },
      },
    ],
  },
});
