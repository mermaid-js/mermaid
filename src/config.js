import { assignWithDepth } from './utils';
const config = {};

export const setConfig = conf => {
  assignWithDepth(config, conf);
};
export const getConfig = () => config;

export const reset = conf => {
  Object.keys(config).forEach(key => delete config[key]);
  assignWithDepth(config, conf, { clobber: true });
};

const configApi = {
  setConfig,
  getConfig,
  reset
};
export default configApi;
