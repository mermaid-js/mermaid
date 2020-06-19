let config = {};

const setConf = function(cnf) {
  // Top level initially mermaid, gflow, sequenceDiagram and gantt
  const lvl1Keys = Object.keys(cnf);
  for (let i = 0; i < lvl1Keys.length; i++) {
    if (typeof cnf[lvl1Keys[i]] === 'object' && cnf[lvl1Keys[i]] != null) {
      const lvl2Keys = Object.keys(cnf[lvl1Keys[i]]);

      for (let j = 0; j < lvl2Keys.length; j++) {
        // logger.debug('Setting conf ', lvl1Keys[i], '-', lvl2Keys[j])
        if (typeof config[lvl1Keys[i]] === 'undefined') {
          config[lvl1Keys[i]] = {};
        }
        // logger.debug('Setting config: ' + lvl1Keys[i] + ' ' + lvl2Keys[j] + ' to ' + cnf[lvl1Keys[i]][lvl2Keys[j]])
        config[lvl1Keys[i]][lvl2Keys[j]] = cnf[lvl1Keys[i]][lvl2Keys[j]];
      }
    } else {
      config[lvl1Keys[i]] = cnf[lvl1Keys[i]];
    }
  }
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
