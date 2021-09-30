import { jsConfig } from './webpack.config.base';

const minConfig = jsConfig();
minConfig.mode = 'production';
minConfig.output.library = {
  type: 'module',
};
minConfig.experiments = {
  outputModule: true,
};
minConfig.output.filename = '[name].esm.min.js';

export default [minConfig];
