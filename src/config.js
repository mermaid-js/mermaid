import { assignWithDepth } from './utils';
const config = {};

export const setConfig = conf => {
  assignWithDepth(config, conf);
};
export const getConfig = () => config;

const configApi = {
  setConfig,
  getConfig
  // get conf() {
  //   return config;
  // }
};
export default configApi;
