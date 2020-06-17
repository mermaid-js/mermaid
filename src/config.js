import utils from './utils';

const config = {};

const setConf = function(cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  utils.assignWithDepth(config, cnf);
};

export const setConfig = conf => {
  setConf(conf);
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
