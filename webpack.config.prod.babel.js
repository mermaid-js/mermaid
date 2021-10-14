import { jsConfig } from './webpack.config.base';

const umdConfig = jsConfig();
umdConfig.mode = 'production';
umdConfig.output.filename = '[name].min.js';

const esmConfig = jsConfig();
esmConfig.mode = 'production';
esmConfig.output.library = {
  type: 'module',
};
esmConfig.experiments = {
  outputModule: true,
};
esmConfig.output.filename = '[name].esm.min.mjs';

export default [umdConfig, esmConfig];
