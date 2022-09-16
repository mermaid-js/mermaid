import { merge, mergeWithCustomize, customizeObject } from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';
import baseConfig from './webpack.config.base';

export default (_env, args) => {
  return [
    // non-minified
    merge(baseConfig, {
      optimization: {
        minimize: false,
      },
    }),
    // core [To be used by webpack/esbuild/vite etc to bundle mermaid]
    merge(baseConfig, {
      externals: [nodeExternals()],
      output: {
        filename: '[name].core.js',
      },
      optimization: {
        minimize: false,
      },
    }),
    // umd
    merge(baseConfig, {
      output: {
        filename: '[name].min.js',
      },
    }),
    // esm
    mergeWithCustomize({
      customizeObject: customizeObject({
        'output.library': 'replace',
      }),
    })(baseConfig, {
      experiments: {
        outputModule: true,
      },
      output: {
        library: {
          type: 'module',
        },
        filename: '[name].esm.min.mjs',
      },
    }),
  ];
};
