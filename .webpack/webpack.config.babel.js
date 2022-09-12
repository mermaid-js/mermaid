import { merge, mergeWithCustomize, customizeObject } from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';
import baseConfig from './webpack.config.base';

export default (_env, args) => {
  return [
    // non-minified
    baseConfig,
    // core [To be used by webpack/esbuild/vite etc to bundle mermaid]
    merge(baseConfig, {
      externals: [nodeExternals()],
      output: {
        filename: '[name].core.js',
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
