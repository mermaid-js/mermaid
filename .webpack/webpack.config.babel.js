import { merge, mergeWithCustomize, customizeObject } from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';
import baseConfig from './webpack.config.base';

export default (_env, args) => {
  switch (args.mode) {
    case 'development':
      return [
        baseConfig,
        merge(baseConfig, {
          externals: [nodeExternals()],
          output: {
            filename: '[name].core.js',
          },
        }),
      ];
    case 'production':
      return [
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
    default:
      throw new Error('No matching configuration was found!');
  }
};
